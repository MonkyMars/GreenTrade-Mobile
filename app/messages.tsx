import BottomNavigation from "components/BottomNavigation";
import { useTheme } from "lib/theme/ThemeContext";
import { useAuth } from "lib/auth/AuthContext";
import { useRef, useState, useEffect } from "react";
import {
    SafeAreaView,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    Alert
} from "react-native";
import { FontAwesome, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import ProtectedRoute from "components/ProtectedRoute";
import { ChatMessage, Conversation } from "lib/types/chat";
import { getConversations } from "lib/backend/chat/getConversations";
import { getMessages } from "lib/backend/chat/getMessages";
import { sendMessage } from "lib/backend/chat/sendMessage";

export default function MessagesScreen() {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params || {};
    const [activeTab, setActiveTab] = useState('messages');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
        params.conversationId ? params.conversationId : null
    );
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const chatSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
    const listRef = useRef<FlatList>(null);

    // Start animations when component mounts
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        // Fetch conversations when component mounts
        if (user && user.id) {
            fetchConversations();
        }
    }, [user]);

    // Check for conversation ID from navigation params and open that conversation
    useEffect(() => {
        if (params.conversationId && !selectedConversationId) {
            setSelectedConversationId(params.conversationId);
        }
    }, [params]);

    // Load chat messages when a conversation is selected
    useEffect(() => {
        if (selectedConversationId) {
            fetchMessages(selectedConversationId);
        } else {
            // Reset chat slide animation when returning to threads list
            chatSlideAnim.setValue(Dimensions.get('window').width);
        }
    }, [selectedConversationId]);

    // Fetch conversations
    const fetchConversations = async (isRefresh = false) => {
        if (!user || !user.id) return;

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const fetchedConversations = await getConversations(user.id);

            // Process conversations to add participantName and other UI properties
            const processedConversations = fetchedConversations.map(convo => {
                // Determine if user is buyer or seller to set the participant info correctly
                const isUserBuyer = convo.buyerId === user.id;
                return {
                    ...convo,
                    participantId: isUserBuyer ? convo.sellerId : convo.buyerId,
                    // Use the actual participant name if provided, don't fall back to Buyer/Seller
                    participantName: convo.participantName || "User",
                    isOnline: convo.isOnline || false,
                    isVerified: convo.isVerified || false,
                    unreadCount: convo.unreadCount || 0,
                    lastMessageTime: convo.lastMessageTime ? new Date(convo.lastMessageTime) : new Date(),
                    lastMessage: convo.lastMessage || "Start a conversation",
                };
            });

            setConversations(processedConversations);

            // Start animations
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();

        } catch (error) {
            console.error('Error fetching conversations:', error);
            Alert.alert('Error', 'Failed to load conversations');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId: string) => {
        if (!conversationId) return;

        setLoadingMessages(true);

        try {
            const fetchedMessages = await getMessages(conversationId);
            setMessages(fetchedMessages);

            // Animate the chat window sliding in
            Animated.spring(chatSlideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();

            // Scroll to the bottom of the chat
            if (listRef.current) {
                setTimeout(() => {
                    listRef.current?.scrollToEnd({ animated: false });
                }, 100);
            }

        } catch (error) {
            console.error('Error fetching messages:', error);
            Alert.alert('Error', 'Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    // Filter conversations based on search query
    const filteredConversations = conversations.filter(conversation =>
        (conversation.participantName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conversation.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format timestamp to a readable format
    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Today, show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            // Yesterday
            return 'Yesterday';
        } else if (diffDays < 7) {
            // This week, show day of week
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            // Older, show date
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Handle sending a new message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversationId || !user || !user.id || sendingMessage) return;

        setSendingMessage(true);

        try {
            const sentMessage = await sendMessage(
                selectedConversationId,
                user.id,
                newMessage.trim()
            );

            // Add message to the current thread
            setMessages(prevMessages => [...prevMessages, sentMessage]);

            // Update the last message in conversations list
            setConversations(prevConversations =>
                prevConversations.map(convo =>
                    convo.id === selectedConversationId
                        ? {
                            ...convo,
                            lastMessage: newMessage.trim(),
                            lastMessageTime: new Date()
                        }
                        : convo
                )
            );

            // Clear input field
            setNewMessage('');

            // Scroll to bottom of chat
            setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    // Return to threads list
    const handleBackToThreads = () => {
        // Animate the chat window sliding out
        Animated.timing(chatSlideAnim, {
            toValue: Dimensions.get('window').width,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            setSelectedConversationId(null);
        });
    };

    // Render conversation item
    const renderConversationItem = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            onPress={() => setSelectedConversationId(item.id)}
            style={{
                flexDirection: 'row',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.card,
            }}
        >
            <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                position: 'relative'
            }}>
                {item.participantImage ? (
                    <Image
                        source={{ uri: item.participantImage }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                ) : (
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                        {(item.participantName || "?").charAt(0).toUpperCase()}
                    </Text>
                )}

                {/* Online indicator */}
                {item.isOnline && (
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: '#4CAF50',
                        borderWidth: 2,
                        borderColor: colors.card
                    }} />
                )}
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: (item.unreadCount || 0) > 0 ? '700' : '500',
                        color: colors.text,
                        marginRight: 6
                    }}>
                        {item.participantName || "User"}
                    </Text>

                    {item.isVerified && (
                        <View style={{
                            backgroundColor: colors.primaryLight,
                            borderRadius: 10,
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                            marginRight: 4,
                        }}>
                            <Text style={{ color: colors.primary, fontSize: 10 }}>✓</Text>
                        </View>
                    )}
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 14,
                        color: (item.unreadCount || 0) > 0 ? colors.text : colors.textSecondary,
                        fontWeight: (item.unreadCount || 0) > 0 ? '500' : 'normal',
                    }}
                >
                    {item.lastMessage || "Start a conversation about " + (item.listingTitle || "this listing")}
                </Text>
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 50 }}>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>
                    {item.lastMessageTime ? formatTime(new Date(item.lastMessageTime)) : ''}
                </Text>

                {(item.unreadCount || 0) > 0 && (
                    <View style={{
                        backgroundColor: colors.primary,
                        borderRadius: 12,
                        minWidth: 22,
                        height: 22,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 6
                    }}>
                        <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>
                            {item.unreadCount}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    // Render message item
    const renderMessageItem = ({ item }: { item: ChatMessage }) => {
        const isUserMessage = item.senderId === user?.id;
        const selectedConversation = conversations.find(c => c.id === selectedConversationId);

        return (
            <View style={{
                flexDirection: 'row',
                justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
                marginBottom: 12,
                paddingHorizontal: 16
            }}>
                {!isUserMessage && (
                    <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.primaryLight,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8,
                        alignSelf: 'flex-end'
                    }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                            {(selectedConversation?.participantName || "?").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={{
                    maxWidth: '70%',
                    backgroundColor: isUserMessage ? colors.primary : colors.card,
                    borderRadius: 20,
                    padding: 12,
                    borderBottomLeftRadius: isUserMessage ? 20 : 4,
                    borderBottomRightRadius: isUserMessage ? 4 : 20,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                }}>
                    <Text style={{
                        color: isUserMessage ? 'white' : colors.text,
                        fontSize: 15,
                    }}>
                        {item.text}
                    </Text>

                    <Text style={{
                        fontSize: 11,
                        color: isUserMessage ? 'rgba(255, 255, 255, 0.7)' : colors.textTertiary,
                        marginTop: 4,
                        textAlign: isUserMessage ? 'right' : 'left'
                    }}>
                        {typeof item.timestamp === 'string'
                            ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    </Text>
                </View>
            </View>
        );
    };

    // Render empty state for no messages
    const renderEmptyState = () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 80 }}>
            <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
            }}>
                <FontAwesome name="comments" size={36} color={colors.primary} />
            </View>

            <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 8
            }}>
                No messages yet
            </Text>

            <Text style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: 24
            }}>
                Start a conversation by messaging a seller about their eco-friendly items
            </Text>

            <TouchableOpacity
                style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
                onPress={() => navigation.navigate('Listings' as never)}
            >
                <Feather name="search" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600' }}>Browse Listings</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <ProtectedRoute>
                <SafeAreaView style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    position: 'relative',
                    width: '100%',
                }}>
                    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                    {/* Threads List View */}
                    {!selectedConversationId && (
                        <Animated.View
                            style={{
                                flex: 1,
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }}
                        >
                            {/* Header */}
                            <View style={{
                                backgroundColor: colors.card,
                                padding: 16,
                                paddingTop: 32,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.borderLight,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 1,
                            }}>
                                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
                                    Messages
                                </Text>
                                <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 4 }}>
                                    Connect with eco-conscious buyers and sellers
                                </Text>
                            </View>

                            {/* Search Input */}
                            <View style={{ padding: 16 }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.card,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                }}>
                                    <Feather name="search" size={20} color={colors.textTertiary} />
                                    <TextInput
                                        placeholder="Search messages..."
                                        placeholderTextColor={colors.textTertiary}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        style={{
                                            flex: 1,
                                            marginLeft: 8,
                                            color: colors.text,
                                            fontSize: 15,
                                        }}
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <Feather name="x" size={18} color={colors.textTertiary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Chat Threads List */}
                            {loading ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading conversations...</Text>
                                </View>
                            ) : conversations.length > 0 ? (
                                <FlatList
                                    data={filteredConversations}
                                    renderItem={renderConversationItem}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={{
                                        paddingBottom: 100, // extra padding for bottom nav
                                    }}
                                    ListEmptyComponent={
                                        searchQuery.length > 0 ? (
                                            <View style={{ padding: 32, alignItems: 'center' }}>
                                                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                                    No messages found matching "{searchQuery}"
                                                </Text>
                                            </View>
                                        ) : null
                                    }
                                />
                            ) : (
                                renderEmptyState()
                            )}
                        </Animated.View>
                    )}

                    {/* Chat Detail View */}
                    {selectedConversationId && (
                        <Animated.View
                            style={{
                                flex: 1,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                paddingTop: 42,
                                backgroundColor: colors.background,
                                transform: [{ translateX: chatSlideAnim }]
                            }}
                        >
                            {/* Chat Header */}
                            <View style={{
                                backgroundColor: colors.card,
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.borderLight,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <TouchableOpacity
                                    onPress={handleBackToThreads}
                                    style={{ marginRight: 12 }}
                                >
                                    <Feather name="arrow-left" size={24} color={colors.text} />
                                </TouchableOpacity>

                                {/* User Avatar */}
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: colors.primaryLight,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                    position: 'relative'
                                }}>
                                    {conversations.find(c => c.id === selectedConversationId)?.participantImage ? (
                                        <Image
                                            source={{ uri: conversations.find(c => c.id === selectedConversationId)?.participantImage || undefined }}
                                            style={{ width: 40, height: 40, borderRadius: 20 }}
                                        />
                                    ) : (
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                                            {(conversations.find(c => c.id === selectedConversationId)?.participantName || "?").charAt(0).toUpperCase()}
                                        </Text>
                                    )}

                                    {/* Online indicator */}
                                    {conversations.find(c => c.id === selectedConversationId)?.isOnline && (
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: '#4CAF50',
                                            borderWidth: 2,
                                            borderColor: colors.card
                                        }} />
                                    )}
                                </View>

                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 6 }}>
                                            {conversations.find(c => c.id === selectedConversationId)?.participantName || "User"}
                                        </Text>

                                        {conversations.find(c => c.id === selectedConversationId)?.isVerified && (
                                            <View style={{
                                                backgroundColor: colors.primaryLight,
                                                borderRadius: 10,
                                                paddingHorizontal: 5,
                                                paddingVertical: 2,
                                            }}>
                                                <Text style={{ color: colors.primary, fontSize: 10 }}>✓</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                                        {conversations.find(c => c.id === selectedConversationId)?.listingTitle && (
                                            `About: ${conversations.find(c => c.id === selectedConversationId)?.listingTitle}`
                                        )}
                                    </Text>
                                </View>

                                <TouchableOpacity style={{ marginLeft: 8, padding: 8 }}>
                                    <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Messages List */}
                            {loadingMessages ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading messages...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    ref={listRef}
                                    data={messages}
                                    renderItem={renderMessageItem}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={{
                                        flexGrow: 1,
                                        paddingVertical: 16,
                                        justifyContent: messages.length === 0 ? 'center' : undefined,
                                    }}
                                    ListEmptyComponent={
                                        <View style={{ padding: 32, alignItems: 'center' }}>
                                            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                                No messages yet. Start the conversation!
                                            </Text>
                                        </View>
                                    }
                                />
                            )}

                            {/* Message Input */}
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                            >
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 12,
                                    backgroundColor: colors.card,
                                    borderTopWidth: 1,
                                    borderTopColor: colors.border,
                                }}>
                                    <TouchableOpacity style={{ padding: 8, marginRight: 8 }}>
                                        <Feather name="plus-circle" size={24} color={colors.primary} />
                                    </TouchableOpacity>

                                    <View style={{
                                        flex: 1,
                                        backgroundColor: colors.background,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        paddingHorizontal: 16,
                                        paddingVertical: Platform.OS === 'ios' ? 10 : 2,
                                        minHeight: 40,
                                    }}>
                                        <TextInput
                                            placeholder="Type a message..."
                                            placeholderTextColor={colors.textTertiary}
                                            value={newMessage}
                                            onChangeText={setNewMessage}
                                            multiline
                                            style={{
                                                color: colors.text,
                                                fontSize: 15,
                                                maxHeight: 100,
                                            }}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={{
                                            padding: 8,
                                            marginLeft: 8,
                                            opacity: (newMessage.trim().length > 0 && !sendingMessage) ? 1 : 0.5
                                        }}
                                        onPress={handleSendMessage}
                                        disabled={newMessage.trim().length === 0 || sendingMessage}
                                    >
                                        {sendingMessage ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <Feather name="send" size={24} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAvoidingView>
                        </Animated.View>
                    )}
                </SafeAreaView>
                <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </ProtectedRoute>
        </>
    );
}
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
    StatusBar
} from "react-native";
import { FontAwesome, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

// Types for our messages
interface Message {
    id: string;
    text: string;
    senderId: string;
    receiverId: string;
    timestamp: Date;
    read: boolean;
}

interface ChatThread {
    id: string;
    participantId: string;
    participantName: string;
    participantImage?: string | null;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    verified: boolean;
    online: boolean;
}

// Mock data for conversations
const mockChatThreads: ChatThread[] = [
    {
        id: '1',
        participantId: 'user1',
        participantName: 'Emma Johnson',
        lastMessage: 'Is this plant pot still available?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        unreadCount: 2,
        verified: true,
        online: true
    },
    {
        id: '2',
        participantId: 'user2',
        participantName: 'Michael Stevens',
        lastMessage: 'Great! I can pick it up tomorrow',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        unreadCount: 0,
        verified: true,
        online: false
    },
    {
        id: '3',
        participantId: 'user3',
        participantName: 'Sarah Williams',
        lastMessage: 'I was wondering if you might consider a trade?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        unreadCount: 0,
        verified: false,
        online: true
    },
    {
        id: '4',
        participantId: 'user4',
        participantName: 'David Chen',
        lastMessage: 'Thank you for the bamboo chair! It looks beautiful in my living room.',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        unreadCount: 0,
        verified: true,
        online: false
    },
    {
        id: '5',
        participantId: 'user5',
        participantName: 'Lisa Rodriguez',
        lastMessage: 'Do you have any more of those reusable bags?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        unreadCount: 0,
        verified: false,
        online: false
    },
];

// Mock data for chat messages
const mockMessages: { [key: string]: Message[] } = {
    // '1': [
    //     {
    //         id: '1-1',
    //         text: 'Hello, I saw your listing for the eco-friendly plant pot. Is it still available?',
    //         senderId: 'user1',
    //         receiverId: 'currentUser',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    //         read: true
    //     },
    //     {
    //         id: '1-2',
    //         text: 'Yes, it is! Are you interested in purchasing it?',
    //         senderId: 'currentUser',
    //         receiverId: 'user1',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 8), // 8 minutes ago
    //         read: true
    //     },
    //     {
    //         id: '1-3',
    //         text: 'Definitely! I love that it\'s made from recycled materials.',
    //         senderId: 'user1',
    //         receiverId: 'currentUser',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 7), // 7 minutes ago
    //         read: true
    //     },
    //     {
    //         id: '1-4',
    //         text: 'Great! Would you like to arrange a pickup or would you prefer shipping?',
    //         senderId: 'currentUser',
    //         receiverId: 'user1',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 6), // 6 minutes ago
    //         read: true
    //     },
    //     {
    //         id: '1-5',
    //         text: 'Is this plant pot still available?',
    //         senderId: 'user1',
    //         receiverId: 'currentUser',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    //         read: false
    //     },
    // ],
    // '2': [
    //     {
    //         id: '2-1',
    //         text: 'Hi there, I\'m interested in the bamboo cutlery set you have listed.',
    //         senderId: 'user2',
    //         receiverId: 'currentUser',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    //         read: true
    //     },
    //     {
    //         id: '2-2',
    //         text: 'Hello! Yes, I still have it. It\'s a complete set with a carrying case.',
    //         senderId: 'currentUser',
    //         receiverId: 'user2',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 115), // 1 hour 55 minutes ago
    //         read: true
    //     },
    //     {
    //         id: '2-3',
    //         text: 'Perfect! I\'d like to buy it. How much is shipping?',
    //         senderId: 'user2',
    //         receiverId: 'currentUser',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1 hour 30 minutes ago
    //         read: true
    //     },
    //     {
    //         id: '2-4',
    //         text: 'Shipping would be €3.50, or you can pick it up for free if you\'re local.',
    //         senderId: 'currentUser',
    //         receiverId: 'user2',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 70), // 1 hour 10 minutes ago
    //         read: true
    //     },
    //     {
    //         id: '2-5',
    //         text: 'Great! I can pick it up tomorrow',
    //         senderId: 'user2',
    //         receiverId: 'currentUser',
    //         timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    //         read: true
    //     },
    // ]
};

export default function MessagesScreen() {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('messages');
    const [chatThreads, setChatThreads] = useState<ChatThread[]>(mockChatThreads);
    const [loading, setLoading] = useState(false);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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
    }, []);

    // Load chat messages when a thread is selected
    useEffect(() => {
        if (selectedThreadId) {
            setLoading(true);
            // Simulating API call to fetch messages
            setTimeout(() => {
                setMessages(mockMessages[selectedThreadId] || []);
                setLoading(false);

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
            }, 500);
        } else {
            // Reset chat slide animation when returning to threads list
            chatSlideAnim.setValue(Dimensions.get('window').width);
        }
    }, [selectedThreadId]);

    // Filter threads based on search query
    const filteredThreads = chatThreads.filter(thread =>
        thread.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
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
    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedThreadId) return;

        const newMsg: Message = {
            id: `${selectedThreadId}-${messages.length + 1}`,
            text: newMessage.trim(),
            senderId: 'currentUser',
            receiverId: `user${selectedThreadId}`,
            timestamp: new Date(),
            read: false
        };

        // Add message to the current thread
        setMessages(prevMessages => [...prevMessages, newMsg]);

        // Update the last message in threads list
        setChatThreads(prevThreads =>
            prevThreads.map(thread =>
                thread.id === selectedThreadId
                    ? {
                        ...thread,
                        lastMessage: newMessage.trim(),
                        lastMessageTime: new Date()
                    }
                    : thread
            )
        );

        // Clear input field
        setNewMessage('');

        // Scroll to bottom of chat
        setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    // Return to threads list
    const handleBackToThreads = () => {
        // Animate the chat window sliding out
        Animated.timing(chatSlideAnim, {
            toValue: Dimensions.get('window').width,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            setSelectedThreadId(null);
        });
    };

    // Render thread item
    const renderThreadItem = ({ item }: { item: ChatThread }) => (
        <TouchableOpacity
            onPress={() => setSelectedThreadId(item.id)}
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
                        {item.participantName.charAt(0).toUpperCase()}
                    </Text>
                )}

                {/* Online indicator */}
                {item.online && (
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
                        fontWeight: item.unreadCount > 0 ? '700' : '500',
                        color: colors.text,
                        marginRight: 6
                    }}>
                        {item.participantName}
                    </Text>

                    {item.verified && (
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
                        color: item.unreadCount > 0 ? colors.text : colors.textSecondary,
                        fontWeight: item.unreadCount > 0 ? '500' : 'normal',
                    }}
                >
                    {item.lastMessage}
                </Text>
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 50 }}>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>
                    {formatTime(item.lastMessageTime)}
                </Text>

                {item.unreadCount > 0 && (
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
    const renderMessageItem = ({ item }: { item: Message }) => {
        const isUserMessage = item.senderId === 'currentUser';

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
                            {mockChatThreads.find(t => t.id === selectedThreadId)?.participantName.charAt(0).toUpperCase()}
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
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isUserMessage && (
                            <Text style={{ marginLeft: 4 }}>
                                {item.read ? ' ✓✓' : ' ✓'}
                            </Text>
                        )}
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
            <SafeAreaView style={{
                flex: 1,
                backgroundColor: colors.background,
                position: 'relative',
                width: '100%',
            }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* Threads List View */}
                {!selectedThreadId && (
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
                        {chatThreads.length > 0 ? (
                            <FlatList
                                data={filteredThreads}
                                renderItem={renderThreadItem}
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
                {selectedThreadId && (
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
                                {chatThreads.find(t => t.id === selectedThreadId)?.participantImage ? (
                                    <Image
                                        source={{ uri: chatThreads.find(t => t.id === selectedThreadId)?.participantImage || undefined }}
                                        style={{ width: 40, height: 40, borderRadius: 20 }}
                                    />
                                ) : (
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                                        {chatThreads.find(t => t.id === selectedThreadId)?.participantName.charAt(0).toUpperCase()}
                                    </Text>
                                )}

                                {chatThreads.find(t => t.id === selectedThreadId)?.online && (
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
                                        {chatThreads.find(t => t.id === selectedThreadId)?.participantName}
                                    </Text>

                                    {chatThreads.find(t => t.id === selectedThreadId)?.verified && (
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
                                    {chatThreads.find(t => t.id === selectedThreadId)?.online ? 'Online now' : 'Last active recently'}
                                </Text>
                            </View>

                            <TouchableOpacity style={{ marginLeft: 8, padding: 8 }}>
                                <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Messages List */}
                        {loading ? (
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
                                        opacity: newMessage.trim().length > 0 ? 1 : 0.5
                                    }}
                                    onPress={handleSendMessage}
                                    disabled={newMessage.trim().length === 0}
                                >
                                    <Feather name="send" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </Animated.View>
                )}
            </SafeAreaView>
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </>
    );
}
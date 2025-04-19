import BottomNavigation from "components/BottomNavigation";
import { useTheme } from "lib/theme/ThemeContext";
import { useAuth } from "lib/auth/AuthContext";
import { useRef, useState, useEffect } from "react";
import {
    SafeAreaView,
    View,
    Animated,
    Dimensions,
    StatusBar,
    Text,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import ProtectedRoute from "components/ProtectedRoute";
import { ChatMessage, Conversation } from "lib/types/chat";
import { useWebSocketChat } from "lib/services/useWebSocketChat";
import {
    isBuyer,
    handleNewMessage,
    fetchConversations,
    fetchMessages,
    handleSendMessage,
    handleSendDateTime,
    handleBackToThreads
} from "lib/functions/chat/main";

// Import components
import ConversationList from "components/chat/ConversationList";
import ChatHeader from "components/chat/ChatHeader";
import MessageList from "components/chat/MessageList";
import MessageInput from "components/chat/MessageInput";

export default function MessagesScreen() {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const route = useRoute();
    const params = route.params || {};

    // State
    const [activeTab, setActiveTab] = useState('messages');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
        params.conversationId ? params.conversationId : null
    );
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const chatSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

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
            fetchConversations(
                user.id,
                setLoading,
                setRefreshing,
                setConversations,
                setError,
                (convo: Conversation) => isBuyer(convo, user.id),
                fadeAnim,
                slideAnim
            );
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
            fetchMessages(
                selectedConversationId,
                setLoadingMessages,
                setMessages,
                setError,
                chatSlideAnim
            );
        } else {
            // Reset chat slide animation when returning to threads list
            chatSlideAnim.setValue(Dimensions.get('window').width);
        }
    }, [selectedConversationId]);

    // Handle pull-to-refresh for conversations list
    const handleRefresh = () => {
        if (user && user.id) {
            fetchConversations(
                user.id,
                setLoading,
                setRefreshing,
                setConversations,
                setError,
                (convo: Conversation) => isBuyer(convo, user.id),
                fadeAnim,
                slideAnim,
                true // indicate this is a refresh operation
            );
        }
    };

    // WebSocket message handler wrapper
    const onNewMessage = (newMessage: ChatMessage) => {
        handleNewMessage(newMessage, setMessages);
    };

    // Use the WebSocket hook
    useWebSocketChat({
        conversationId: selectedConversationId,
        userId: user?.id || null,
        onMessage: onNewMessage,
        onError: (errorMsg: string) => setError(errorMsg)
    });

    // Wrapper for the send message function
    const onSendMessage = async (text: string) => {
        if (!user?.id) return;
        await handleSendMessage(
            text,
            selectedConversationId,
            user.id,
            sendingMessage,
            setSendingMessage,
            setError,
            setConversations
        );
    };

    // Wrapper for the send date/time function
    const onSendDateTime = async (selectedDate: Date) => {
        if (!user?.id) return;
        await handleSendDateTime(
            selectedDate,
            selectedConversationId,
            user.id,
            sendingMessage,
            setSendingMessage,
            setError,
            setConversations
        );
    };

    // Wrapper for the back to threads function
    const onBackToThreads = () => {
        handleBackToThreads(chatSlideAnim, setSelectedConversationId);
    };

    // Find the selected conversation
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

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

                    {/* Error message banner if present */}
                    {error && (
                        <View style={{
                            backgroundColor: '#FF6B6B',
                            padding: 12,
                            width: '100%',
                            alignItems: 'center',
                            zIndex: 100
                        }}>
                            <Text style={{ color: 'white', fontWeight: '600' }}>
                                {error}
                            </Text>
                        </View>
                    )}

                    {/* Threads List View */}
                    {!selectedConversationId && (
                        <Animated.View
                            style={{
                                flex: 1,
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }}
                        >
                            <ConversationList
                                conversations={conversations}
                                loading={loading}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                onConversationPress={setSelectedConversationId}
                                userId={user?.id}
                                colors={colors}
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                            />
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
                                paddingTop: error ? 36 : 42, // Adjust padding if error banner is showing
                                backgroundColor: colors.background,
                                transform: [{ translateX: chatSlideAnim }]
                            }}
                        >
                            <ChatHeader
                                conversation={selectedConversation}
                                userId={user?.id}
                                onBackPress={onBackToThreads}
                                colors={colors}
                            />

                            <MessageList
                                messages={messages}
                                loading={loadingMessages}
                                conversation={selectedConversation}
                                userId={user?.id}
                                colors={colors}
                            />

                            <MessageInput
                                onSendMessage={onSendMessage}
                                onSendDateTime={onSendDateTime}
                                sending={sendingMessage}
                                colors={colors}
                            />
                        </Animated.View>
                    )}
                </SafeAreaView>
                <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </ProtectedRoute>
        </>
    );
}
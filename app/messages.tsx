import BottomNavigation from "components/BottomNavigation";
import { useTheme } from "lib/theme/ThemeContext";
import { useAuth } from "lib/auth/AuthContext";
import { useRef, useState, useEffect, useCallback } from "react";
import {
    SafeAreaView,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    Alert,
    Modal,
    ScrollView,
    Linking
} from "react-native";
import { FontAwesome, Feather, MaterialCommunityIcons, Ionicons, AntDesign, Entypo } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import ProtectedRoute from "components/ProtectedRoute";
import { ChatMessage, Conversation } from "lib/types/chat";
import { getConversations } from "lib/backend/chat/getConversations";
import { getMessages } from "lib/backend/chat/getMessages";
import { sendMessage } from "lib/backend/chat/sendMessage";
import { BASE_URL } from "lib/backend/api/axiosConfig";
import CustomDatePicker from "components/CustomDatePicker";

export default function MessagesScreen() {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params || {};
    const ws = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isUnmounting = useRef(false);
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
    const [error, setError] = useState<string | null>(null);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

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

    useEffect(() => {
        // Check if there are new messages and scroll to the bottom
        if (listRef.current && messages.length > 0) {
            setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages])

    // Load chat messages when a conversation is selected
    useEffect(() => {
        if (selectedConversationId) {
            fetchMessages(selectedConversationId);
        } else {
            // Reset chat slide animation when returning to threads list
            chatSlideAnim.setValue(Dimensions.get('window').width);
        }
    }, [selectedConversationId]);

    const isBuyer = (conversation: Conversation) => {
        return conversation.buyerId === user?.id;
    }

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
                const isUserBuyer = isBuyer(convo);
                return {
                    ...convo,
                    participantId: isUserBuyer ? convo.sellerId : convo.buyerId,
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

    // Helper function to format date for dividers
    const formatDateForDivider = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const messageDate = new Date(date);
        messageDate.setHours(0, 0, 0, 0);

        if (messageDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    // WebSocket connection handling with reconnection logic
    const connectWebSocket = useCallback(() => {
        if (!selectedConversationId || !user) {
            console.log("No conversation ID or user found. Skipping WebSocket connection.");
            return;
        }

        // Clear any existing reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close existing connection if open
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            ws.current.close();
        }

        try {
            // Get the base URL with protocol
            const wsBaseUrl = BASE_URL.replace(/^https?:\/\//, '');
            const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
            const wsUrl = `${wsProtocol}://${wsBaseUrl}/ws/chat/${selectedConversationId}/${user.id}`;
            console.log(`Attempting to connect to WebSocket: ${wsUrl}`);

            // Create a standard WebSocket connection
            ws.current = new WebSocket(wsUrl);

            // Set a connection timeout to handle when the WebSocket fails to connect
            const connectionTimeout = setTimeout(() => {
                if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
                    console.log("WebSocket connection timeout, closing and retrying");
                    ws.current.close();
                }
            }, 5000);

            ws.current.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log(`WebSocket connected for conversation ${selectedConversationId}`);
                // Reset reconnect attempts on successful connection
                reconnectAttempts.current = 0;
                setError(null);

                // Send a small ping message to ensure the connection is fully established
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    try {
                        ws.current.send(JSON.stringify({ type: "ping" }));
                    } catch (e) {
                        console.error("Error sending initial ping:", e);
                    }
                }
            };

            ws.current.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log(`WebSocket disconnected for conversation ${selectedConversationId}`, event.code, event.reason);

                // Don't attempt to reconnect if we closed intentionally, are unmounting, or reached max attempts
                if (isUnmounting.current || event.code === 1000 || reconnectAttempts.current >= maxReconnectAttempts) {
                    console.log("Not attempting to reconnect: clean close, unmounting, or max attempts reached");
                    return;
                }

                // Implement exponential backoff for reconnection
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (!isUnmounting.current && reconnectAttempts.current < maxReconnectAttempts) {
                        reconnectAttempts.current++;
                        connectWebSocket();
                    } else {
                        setError("Failed to connect to chat after multiple attempts. Please try again later.");
                    }
                }, delay);
            };

            ws.current.onerror = (event) => {
                console.error("WebSocket error:", event);
                // Don't set error here as onclose will be called after error
            };

            ws.current.onmessage = (event) => {
                try {
                    // Handle ping/pong messages for keeping the connection alive
                    if (event.data === "ping" || event.data === '{"type":"ping"}') {
                        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                            ws.current.send(JSON.stringify({ type: "pong" }));
                        }
                        return;
                    }

                    const messageData = JSON.parse(event.data);
                    // Assuming the backend sends messages in the same structure as the Message struct
                    const newChatMessage: ChatMessage = {
                        text: messageData.content,
                        id: messageData.id,
                        conversationId: messageData.conversation_id,
                        senderId: messageData.sender_id,
                        timestamp: new Date(messageData.created_at),
                    };
                    // Update state with the new message
                    setMessages((prevMessages) => [...prevMessages, newChatMessage]);
                } catch (e) {
                    console.error("Failed to parse incoming WebSocket message:", e);
                }
            };
        } catch (error) {
            console.error("Error creating WebSocket connection:", error);
            setError("Failed to establish chat connection. Please try again.");
        }
    }, [selectedConversationId, user, setError]);

    // Set up a ping interval to keep the connection alive
    useEffect(() => {
        let pingInterval: NodeJS.Timeout | null = null;

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            pingInterval = setInterval(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    try {
                        ws.current.send(JSON.stringify({ type: "ping" }));
                    } catch (e) {
                        console.error("Error sending ping:", e);
                        // If ping fails, try to reconnect
                        if (ws.current) {
                            ws.current.close();
                        }
                    }
                }
            }, 30000); // Send a ping every 30 seconds
        }

        return () => {
            if (pingInterval) {
                clearInterval(pingInterval);
            }
        };
    }, [ws.current?.readyState]);

    useEffect(() => {
        // Mark unmounting flag as false when the component mounts
        isUnmounting.current = false;

        // Reset reconnection attempts when conversation changes
        reconnectAttempts.current = 0;
        connectWebSocket();

        // Cleanup: Close WebSocket connection when component unmounts or IDs change
        return () => {
            // Mark as unmounting to prevent reconnection attempts during cleanup
            isUnmounting.current = true;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (ws.current) {
                // Use code 1000 to indicate normal closure
                ws.current.close(1000, "Component unmounting or conversation changed");
            }
        };
    }, [selectedConversationId, user, connectWebSocket]);

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
        (conversation.buyerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conversation.lastMessage ? conversation.lastMessage.text : conversation.sellerName || "").toLowerCase().includes(searchQuery.toLowerCase())
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

    // Process messages to include date dividers
    const processMessagesWithDateDividers = (messages: ChatMessage[]) => {
        if (!messages.length) return [];

        const result: (ChatMessage | { id: string, isDateDivider: true, date: string })[] = [];
        let currentDate: string | null = null;

        messages.forEach(message => {
            const messageDate = new Date(message.timestamp);
            const dateString = messageDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            if (dateString !== currentDate) {
                currentDate = dateString;
                result.push({
                    id: `divider-${dateString}`,
                    isDateDivider: true,
                    date: formatDateForDivider(messageDate)
                });
            }

            result.push(message);
        });

        return result;
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

            // Update the last message in conversations list
            setConversations(prevConversations =>
                prevConversations.map(convo =>
                    convo.id === selectedConversationId
                        ? {
                            ...convo,
                            lastMessage: sentMessage, // Use the sent message object
                            lastMessageTime: sentMessage.timestamp // Use timestamp from sent message
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

    // Function to handle sending a date/time
    const handleSendDateTime = async () => {
        if (!selectedConversationId || !user || !user.id || sendingMessage) return;

        setSendingMessage(true);

        try {
            // Create a formatted date string for display
            const formattedDate = selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            const formattedTime = selectedDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Create a special message with date metadata
            const dateMessage = {
                text: `📅 ${formattedDate} at ${formattedTime}`,
                type: 'date',
                timestamp: selectedDate.toISOString()
            };

            // Send the message as a JSON string
            const sentMessage = await sendMessage(
                selectedConversationId,
                user.id,
                JSON.stringify(dateMessage)
            );

            // Update conversations list with the new message
            setConversations(prevConversations =>
                prevConversations.map(convo =>
                    convo.id === selectedConversationId
                        ? {
                            ...convo,
                            lastMessage: sentMessage,
                            lastMessageTime: sentMessage.timestamp
                        }
                        : convo
                )
            );

            // Close menus
            setShowDatePicker(false);
            setShowPlusMenu(false);

            // Scroll to bottom of chat
            setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error) {
            console.error('Error sending date message:', error);
            Alert.alert('Error', 'Failed to send date');
        } finally {
            setSendingMessage(false);
        }
    };

    // Function to handle calendar event creation
    const addToCalendar = (dateString: string) => {
        try {
            const date = new Date(dateString);
            // Format for calendar URL
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            // Create a calendar event URL
            // This uses standard URI format that works across platforms
            const title = encodeURIComponent("Meeting from GreenTrade");
            const details = encodeURIComponent("Meeting scheduled via GreenTrade Chat");
            const startDate = `${year}${month}${day}T${hours}${minutes}00`;
            const endDate = `${year}${month}${day}T${(parseInt(hours) + 1).toString().padStart(2, '0')}${minutes}00`;

            let calendarUrl = '';

            if (Platform.OS === 'ios') {
                // iOS uses calshow: URL scheme
                calendarUrl = `calshow:${date.getTime()}`;
            } else {
                // Android uses intent with calendar provider
                calendarUrl = `content://com.android.calendar/time/${date.getTime()}`;
            }

            // Open the calendar app
            Linking.openURL(calendarUrl).catch(err => {
                console.error('Error opening calendar:', err);

                // Fallback to creating a new event if direct opening fails
                const fallbackUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startDate}/${endDate}`;
                Linking.openURL(fallbackUrl).catch(err => {
                    Alert.alert('Calendar Error', 'Could not open calendar app. Please add this event manually.');
                });
            });

        } catch (error) {
            console.error('Error adding to calendar:', error);
            Alert.alert('Calendar Error', 'Could not add event to calendar');
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

                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                    {(isBuyer(item) ? item.sellerName : item.buyerName || "?").charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{
                        fontSize: 16,
                        color: colors.text,
                        marginRight: 6
                    }}>
                        {isBuyer(item) ? item.sellerName : item.buyerName || "User"}
                    </Text>
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 14,
                        color: colors.textTertiary,
                    }}
                >
                    {item.lastMessage ? item.lastMessage.text : "Start a conversation about " + (item.listingName || "this listing")}
                </Text>
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 50 }}>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>
                    {item.lastMessage ? formatTime(new Date(item.lastMessage.timestamp)) : ''}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // Render message item or date divider
    const renderMessageItem = ({ item }: { item: any }) => {
        // If this is a date divider, render the date header
        if ('isDateDivider' in item) {
            return (
                <View style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    marginVertical: 8
                }}>
                    <View style={{
                        backgroundColor: colors.primaryLight,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 16,
                    }}>
                        <Text style={{
                            color: colors.primary,
                            fontSize: 13,
                            fontWeight: '500'
                        }}>
                            {item.date}
                        </Text>
                    </View>
                </View>
            );
        }

        // Check if this is a date message (which would be in JSON format)
        let isDateMessage = false;
        let dateData = null;

        try {
            if (item.text.startsWith('{"text":"📅')) {
                const parsedMessage = JSON.parse(item.text);
                if (parsedMessage.type === 'date') {
                    isDateMessage = true;
                    dateData = parsedMessage;
                }
            }
        } catch (e) {
            // Not a valid JSON message, treat as regular message
        }

        // Otherwise render a normal message or date message
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
                            {(selectedConversation && (isBuyer(selectedConversation) ? selectedConversation.sellerName : selectedConversation.buyerName) || "?").charAt(0).toUpperCase()}
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
                    {isDateMessage ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (dateData && dateData.timestamp) {
                                    addToCalendar(dateData.timestamp);
                                }
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                color: isUserMessage ? 'white' : colors.text,
                                fontSize: 15,
                            }}>
                                {dateData.text}
                            </Text>
                            <View style={{ marginLeft: 8 }}>
                                <AntDesign
                                    name="calendar"
                                    size={16}
                                    color={isUserMessage ? 'white' : colors.primary}
                                />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <Text style={{
                            color: isUserMessage ? 'white' : colors.text,
                            fontSize: 15,
                        }}>
                            {item.text}
                        </Text>
                    )}

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
                                paddingTop: StatusBar.currentHeight,
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
                                    {(() => {
                                        const selectedConversation = conversations.find(c => c.id === selectedConversationId);
                                        if (!selectedConversation) return null; // Handle case where conversation is not found

                                        const participantName = isBuyer(selectedConversation)
                                            ? selectedConversation.sellerName
                                            : selectedConversation.buyerName;

                                        return (
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                                                {(participantName || "?").charAt(0).toUpperCase()}
                                            </Text>
                                        );
                                    })()}
                                </View>

                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {(() => {
                                            const selectedConversation = conversations.find(c => c.id === selectedConversationId);
                                            if (!selectedConversation) return null; // Handle case where conversation is not found

                                            const participantName = isBuyer(selectedConversation)
                                                ? selectedConversation.sellerName
                                                : selectedConversation.buyerName;

                                            return (
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 6 }} onPress={() => {
                                                    navigation.navigate("SellerDetail", { id: isBuyer(selectedConversation) ? selectedConversation.sellerId : selectedConversation.buyerId } as never);
                                                }}>
                                                    {participantName || "User"}
                                                </Text>
                                            );
                                        })()}
                                    </View>

                                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                                        {conversations.find(c => c.id === selectedConversationId)?.listingName && (
                                            `About: ${conversations.find(c => c.id === selectedConversationId)?.listingName}`
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
                                <View style={{ flex: 1 }}>
                                    <FlatList
                                        ref={listRef}
                                        data={processMessagesWithDateDividers(messages)}
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
                                </View>
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
                                    <TouchableOpacity
                                        style={{ padding: 8, marginRight: 8 }}
                                        onPress={() => setShowPlusMenu(!showPlusMenu)}
                                    >
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

                                {/* Plus Menu */}
                                {showPlusMenu && (
                                    <View style={{
                                        backgroundColor: colors.card,
                                        padding: 16,
                                        borderTopWidth: 1,
                                        borderTopColor: colors.border,
                                    }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            justifyContent: 'flex-start',
                                        }}>
                                            {/* Date/Time Tile */}
                                            <TouchableOpacity
                                                style={{
                                                    width: '16.66%', // 6 tiles per row
                                                    aspectRatio: 1,
                                                    padding: 4,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                                onPress={() => {
                                                    setShowDatePicker(true);
                                                }}
                                            >
                                                <View style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: colors.primaryLight,
                                                    borderRadius: 12,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <AntDesign name="calendar" size={24} color={colors.primary} />
                                                </View>
                                                <Text style={{
                                                    fontSize: 11,
                                                    color: colors.text,
                                                    marginTop: 4,
                                                    textAlign: 'center',
                                                }}>
                                                    Date
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Placeholder for 5 more tiles */}
                                            {Array(5).fill(0).map((_, index) => (
                                                <View key={index} style={{
                                                    width: '16.66%',
                                                    aspectRatio: 1,
                                                    padding: 4,
                                                }} />
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </KeyboardAvoidingView>

                            {/* Date Picker Modal - Directly use CustomDatePicker instead of nesting in another modal */}
                            <CustomDatePicker
                                isVisible={showDatePicker}
                                colors={colors}
                                onConfirm={(date) => {
                                    setSelectedDate(date);
                                    handleSendDateTime(); // Send date immediately after confirmation
                                }}
                                onClose={() => setShowDatePicker(false)}
                                selectedDate={selectedDate}
                            />
                        </Animated.View>
                    )}
                </SafeAreaView>
                <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </ProtectedRoute>
        </>
    );
}
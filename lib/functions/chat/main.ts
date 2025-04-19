import { Alert, Animated, Dimensions } from 'react-native'
import { Conversation, ChatMessage } from 'lib/types/chat'
import { getConversations } from 'lib/backend/chat/getConversations'
import { getMessages } from 'lib/backend/chat/getMessages'
import { sendMessage } from 'lib/backend/chat/sendMessage'

/**
 * Determines if a user is a buyer in a conversation
 */
export const isBuyer = (conversation: Conversation, userId?: string) => {
  return conversation.buyerId === userId
}

/**
 * Handles new incoming messages from the WebSocket
 */
export const handleNewMessage = (
  newMessage: ChatMessage,
  setMessages: (
    callback: (prevMessages: ChatMessage[]) => ChatMessage[],
  ) => void,
) => {
  // Add message to the messages array
  setMessages(prevMessages => [...prevMessages, newMessage])
}

/**
 * Fetches all conversations for a user
 */
export const fetchConversations = async (
  userId: string,
  setLoading: (loading: boolean) => void,
  setRefreshing: (refreshing: boolean) => void,
  setConversations: (conversations: Conversation[]) => void,
  setError: (error: string | null) => void,
  isBuyerFn: (conversation: Conversation) => boolean,
  fadeAnim: Animated.Value,
  slideAnim: Animated.Value,
  isRefresh = false,
) => {
  if (!userId) return

  if (isRefresh) {
    setRefreshing(true)
  } else {
    setLoading(true)
  }

  // Clear any previous errors
  setError(null)

  try {
    const fetchedConversations = await getConversations(userId)

    // Process conversations to add participantName and other UI properties
    const processedConversations = fetchedConversations.map(convo => {
      // Determine if user is buyer or seller to set the participant info correctly
      const isUserBuyer = isBuyerFn(convo)
      return {
        ...convo,
        participantId: isUserBuyer ? convo.sellerId : convo.buyerId,
      }
    })

    setConversations(processedConversations)

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
    ]).start()
  } catch (error) {
    console.error('Error fetching conversations:', error)
    setError('Failed to load conversations. Please try again.')
    Alert.alert('Error', 'Failed to load conversations')
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
}

/**
 * Fetches messages for a specific conversation
 */
export const fetchMessages = async (
  conversationId: string,
  setLoadingMessages: (loading: boolean) => void,
  setMessages: (messages: ChatMessage[]) => void,
  setError: (error: string | null) => void,
  chatSlideAnim: Animated.Value,
) => {
  if (!conversationId) return

  setLoadingMessages(true)
  // Clear any previous errors
  setError(null)

  try {
    const fetchedMessages = await getMessages(conversationId)
    setMessages(fetchedMessages)

    // Animate the chat window sliding in
    Animated.spring(chatSlideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start()
  } catch (error) {
    console.error('Error fetching messages:', error)
    setError('Failed to load messages. Please try again.')
    Alert.alert('Error', 'Failed to load messages')
  } finally {
    setLoadingMessages(false)
  }
}

/**
 * Sends a text message in a conversation
 */
export const handleSendMessage = async (
  text: string,
  conversationId: string | null,
  userId: string,
  sendingMessage: boolean,
  setSendingMessage: (sending: boolean) => void,
  setError: (error: string | null) => void,
  setConversations: (
    callback: (prevConversations: Conversation[]) => Conversation[],
  ) => void,
) => {
  if (!text.trim() || !conversationId || !userId || sendingMessage) return

  setSendingMessage(true)
  // Clear any previous errors
  setError(null)

  try {
    const sentMessage = await sendMessage(conversationId, userId, text.trim())

    // Update the last message in conversations list
    setConversations(prevConversations =>
      prevConversations.map(convo =>
        convo.id === conversationId
          ? {
              ...convo,
              lastMessage: sentMessage, // Use the sent message object
              lastMessageTime: sentMessage.timestamp, // Use timestamp from sent message
            }
          : convo,
      ),
    )
  } catch (error) {
    console.error('Error sending message:', error)
    setError('Failed to send message. Please try again.')
    Alert.alert('Error', 'Failed to send message')
  } finally {
    setSendingMessage(false)
  }
}

/**
 * Sends a date/time message in a conversation
 */
export const handleSendDateTime = async (
  selectedDate: Date,
  conversationId: string | null,
  userId: string,
  sendingMessage: boolean,
  setSendingMessage: (sending: boolean) => void,
  setError: (error: string | null) => void,
  setConversations: (
    callback: (prevConversations: Conversation[]) => Conversation[],
  ) => void,
) => {
  if (!conversationId || !userId || sendingMessage) return

  setSendingMessage(true)
  // Clear any previous errors
  setError(null)

  try {
    // Create a formatted date string for display
    const formattedDate = selectedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const formattedTime = selectedDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Create a special message with date metadata
    const dateMessage = {
      text: `📅 ${formattedDate} at ${formattedTime}`,
      type: 'date',
      timestamp: selectedDate.toISOString(),
    }

    // Send the message as a JSON string
    const sentMessage = await sendMessage(
      conversationId,
      userId,
      JSON.stringify(dateMessage),
    )

    // Update conversations list with the new message
    setConversations(prevConversations =>
      prevConversations.map(convo =>
        convo.id === conversationId
          ? {
              ...convo,
              lastMessage: sentMessage,
              lastMessageTime: sentMessage.timestamp,
            }
          : convo,
      ),
    )
  } catch (error) {
    console.error('Error sending date message:', error)
    setError('Failed to send date. Please try again.')
    Alert.alert('Error', 'Failed to send date')
  } finally {
    setSendingMessage(false)
  }
}

/**
 * Handles the navigation back to threads list
 */
export const handleBackToThreads = (
  chatSlideAnim: Animated.Value,
  setSelectedConversationId: (id: string | null) => void,
) => {
  // Animate the chat window sliding out
  Animated.timing(chatSlideAnim, {
    toValue: Dimensions.get('window').width,
    duration: 250,
    useNativeDriver: true,
  }).start(() => {
    setSelectedConversationId(null)
  })
}

import api from 'lib/backend/api/axiosConfig'
import { ChatMessage, Conversation } from 'lib/types/chat'

/**
 * Determines if the current user is the buyer in a conversation
 */
export function isBuyer(conversation: Conversation, userId: string): boolean {
  return conversation.buyerId === userId
}

/**
 * Handles a new incoming message from the WebSocket
 */
export function handleNewMessage(
  newMessage: ChatMessage,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
): void {
  setMessages(prevMessages => {
    // Check if the message already exists in the array to prevent duplicates
    const messageExists = prevMessages
      .filter(Boolean)
      .some(msg => msg.id === newMessage.id)
    if (messageExists) {
      return prevMessages
    }

    // Add the new message and sort by timestamp
    const updatedMessages = [...prevMessages, newMessage].filter(Boolean)
    return updatedMessages.sort((a, b) => {
      const dateA =
        a.timestamp instanceof Date
          ? a.timestamp.getTime()
          : new Date(a.timestamp).getTime()
      const dateB =
        b.timestamp instanceof Date
          ? b.timestamp.getTime()
          : new Date(b.timestamp).getTime()
      return dateA - dateB
    })
  })
}

/**
 * Fetches all conversations for a user
 */
export async function fetchConversations(
  userId: string,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setRefreshing?: React.Dispatch<React.SetStateAction<boolean>>,
  setConversations?: React.Dispatch<React.SetStateAction<Conversation[]>>,
  setError?: React.Dispatch<React.SetStateAction<string | null>>,
  isRefresh: boolean = false,
): Promise<Conversation[] | undefined> {
  if (!isRefresh) {
    setLoading(true)
  }
  if (setRefreshing) {
    setRefreshing(true)
  }

  try {
    const response = await api.get(`/api/chat/conversation/${userId}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations = response.data.data.map((conversation: any) => ({
      id: conversation.id,
      listingId: conversation.listing_id,
      sellerId: conversation.seller_id,
      buyerId: conversation.buyer_id,
      sellerName: conversation.seller_name,
      buyerName: conversation.buyer_name,
      listingName: conversation.listing_title,
      lastMessage: conversation.last_message_content
        ? {
            text: conversation.last_message_content,
            timestamp: new Date(conversation.last_message_time),
          }
        : undefined,
    }))

    if (setConversations) {
      setConversations(conversations)
    }

    if (setError) {
      setError(null)
    }

    return conversations
  } catch (error) {
    console.error('Error fetching conversations:', error)
    if (setError) {
      setError('Failed to load conversations. Please try again.')
    }
    return undefined
  } finally {
    setLoading(false)
    if (setRefreshing) {
      setRefreshing(false)
    }
  }
}

/**
 * Fetches messages for a specific conversation
 */
export async function fetchMessages(
  conversationId: string,
  setLoadingMessages: React.Dispatch<React.SetStateAction<boolean>>,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setError?: React.Dispatch<React.SetStateAction<string | null>>,
): Promise<ChatMessage[] | undefined> {
  setLoadingMessages(true)

  try {
    const response = await api.get(`/api/chat/messages/${conversationId}`)

    const messages: ChatMessage[] = response.data.data
      .filter(Boolean)
      .map(
        (message: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
        }) => {
          return {
            id: message.id,
            conversationId: message.conversation_id,
            senderId: message.sender_id,
            text: message.content,
            timestamp: new Date(message.created_at),
          }
        },
      )
    setMessages(messages)

    if (setError) {
      setError(null)
    }

    return messages
  } catch (error) {
    console.error('Error fetching messages:', error)
    if (setError) {
      setError('Failed to load messages. Please try again.')
    }
    return undefined
  } finally {
    setLoadingMessages(false)
  }
}

/**
 * Updates the UI when a new message is received via WebSocket
 */
export function updateConversationLastMessage(
  message: ChatMessage,
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>,
): void {
  setConversations(prevConversations =>
    prevConversations.map(conv =>
      conv.id === message.conversationId
        ? {
            ...conv,
            lastMessage: {
              text: message.text,
              timestamp: message.timestamp,
            },
          }
        : conv,
    ),
  )
}

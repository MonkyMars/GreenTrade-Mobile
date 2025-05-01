import { ChatMessage } from 'lib/types/chat'
import api from '../api/axiosConfig'

export const getMessages = async (
  conversationId: string,
): Promise<ChatMessage[]> => {
  try {
    const response = await api.get(`/api/chat/messages/${conversationId}`)

    if (!response.data.success) {
      throw new Error('Failed to fetch messages')
    }

    return response.data.data.map((message: any) => ({
      text: message.content,
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      timestamp: new Date(message.created_at),
    })) as ChatMessage[]
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw new Error('Failed to fetch messages')
  }
}

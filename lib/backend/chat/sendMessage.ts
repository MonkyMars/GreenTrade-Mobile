import { ChatMessage } from 'lib/types/chat'
import api from '../api/axiosConfig'

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
): Promise<ChatMessage> => {
  try {
    const body = {
      conversation_id: conversationId,
      sender_id: senderId,
      content: text,
    }

    const response = await api.post('/api/chat/message', body)

    if (!response.data.success) {
      throw new Error('Failed to send message')
    }

    return {
      text: response.data.data.content,
      id: response.data.data.id,
      conversationId: response.data.data.conversation_id,
      senderId: response.data.data.sender_id,
      timestamp: new Date(response.data.data.created_at),
    }
  } catch (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }
}

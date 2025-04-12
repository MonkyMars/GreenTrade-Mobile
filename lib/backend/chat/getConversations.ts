import { Conversation } from 'lib/types/chat'
import api from '../api/axiosConfig'

export const getConversations = async (
  userId: string,
): Promise<Conversation[]> => {
  try {
    const response = await api.get(`/api/chat/conversation/${userId}`)

    if (!response.data.success) {
      throw new Error('Failed to fetch conversations')
    }

    return response.data.data
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw new Error('Failed to fetch conversations')
  }
}

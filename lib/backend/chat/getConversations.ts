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

    return response.data.data.map((conversation: any) => ({
      id: conversation.id,
      listingId: conversation.listing_id,
      sellerId: conversation.seller_id,
      buyerId: conversation.buyer_id,
      sellerName: conversation.seller_name,
      buyerName: conversation.buyer_name,
      listingName: conversation.listing_name,
      lastMessage: conversation.last_message_content
        ? {
            text: conversation.last_message_content,
            timestamp: new Date(conversation.last_message_time),
          }
        : undefined,
    }))
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw new Error('Failed to fetch conversations')
  }
}

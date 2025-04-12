import { FetchedListing } from 'lib/types/main'
import { User } from 'lib/types/user'
import api from '../api/axiosConfig'
import { Conversation } from 'lib/types/chat'

export const createConversation = async (
  listingId: FetchedListing['id'],
  sellerId: FetchedListing['sellerId'],
  buyerId: User['id'],
): Promise<Conversation['id']> => {
  try {
    const body = {
      listing_id: listingId,
      seller_id: sellerId,
      buyer_id: buyerId,
    }

    const response = await api.post('/api/chat/conversation', body)

    if (!response.data.success) {
      throw new Error('Failed to create conversation')
    }

    return response.data.id
  } catch (error) {
    console.error('Error creating conversation:', error)
    throw new Error('Failed to create conversation')
  }
}

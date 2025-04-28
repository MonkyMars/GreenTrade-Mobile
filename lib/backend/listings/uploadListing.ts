import AsyncStorage from '@react-native-async-storage/async-storage'
import { UploadListing } from '../../types/main'
import api from '../api/axiosConfig'

export const uploadListing = async (listing: UploadListing) => {
  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required. Please log in.')
    }

    // Format the data to match the backend's expected structure
    const formattedListing = {
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      price: listing.price,
      negotiable: listing.negotiable,
      ecoScore: listing.ecoScore,
      ecoAttributes: listing.ecoAttributes,
      imageUrl: {
        urls: listing.imageUrl,
      },
      seller_id: listing.sellerId,
    }

    const response = await api.post('/api/listings', formattedListing, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    // Check if the response has the expected format
    if (!response.data || !response.data.success) {
      throw new Error(
        'Failed to upload listing: Server returned unsuccessful response',
        response.data.message,
      )
    }

    return response.data.data
  } catch (error) {
    console.error('Upload listing error:', error)
    throw error
  }
}

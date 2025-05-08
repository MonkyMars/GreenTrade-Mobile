import { UploadListing } from 'lib/types/main'
import api from 'lib/backend/api/axiosConfig'
import { AppError, retryOperation } from 'lib/errorUtils'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const uploadListing = async (listing: UploadListing) => {
  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      throw new AppError('Authentication required. Please log in.', {
        code: 'AUTH_REQUIRED',
        status: 401,
      })
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

    // Use our new strongly-typed retry function
    const response = await retryOperation(
      () =>
        api.post('/api/listings', formattedListing, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      {
        context: 'Uploading listing',
        maxRetries: 3,
        showToastOnRetry: true,
      },
    )

    // Check if the response has the expected format
    if (!response.data || !response.data.success) {
      const errorMessage = response.data?.message || 'Failed to upload listing'
      throw new AppError(errorMessage, {
        code: 'UPLOAD_FAILED',
        status: response.status,
      })
    }
    return response.data.data
  } catch (error) {
    // Our retryOperation will handle most errors and convert them to AppError,
    // but we can also handle them here to provide more specific error information

    // Convert to AppError if not already
    const appError =
      error instanceof AppError ? error : AppError.from(error, 'Upload listing')

    // Log in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Upload listing error:', appError)
    }

    // Rethrow for component handling
    throw appError
  }
}

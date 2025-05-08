import { AppError, retryOperation } from 'lib/errorUtils'
import api from '../api/axiosConfig'
import { Seller } from 'lib/types/seller'
import { getSellerListings } from '../listings/getListings'

export const fetchSellerData = async (id: string) => {
  try {
    // Fetch seller information with retry logic and proper error typing
    const response = await retryOperation(() => api.get(`/seller/${id}`), {
      context: 'Fetching seller profile',
      maxRetries: 3,
      showToastOnRetry: false, // We have our own loading toast
    })

    if (!response.data || !response.data.success) {
      throw new AppError(response.data?.message || 'Failed to fetch seller', {
        code: 'FETCH_FAILED',
        status: response.status,
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(response.data.data)
    }

    const sellerObject: Seller = {
      id: response.data.data.id,
      name: response.data.data.name,
      bio: response.data.data.bio,
      rating: response.data.data.rating,
      verified: response.data.data.verified,
      createdAt: response.data.data.created_at,
    }

    // Fetch seller's listings - getSellerListings already has retry and error handling
    const sellerListings = await getSellerListings(id as string)

    return {
      seller: sellerObject,
      listings: sellerListings,
    }
  } catch (error) {
    // Convert to AppError if not already
    const appError =
      error instanceof AppError
        ? error
        : AppError.from(error, 'Fetching seller profile')

    // Handle error properly with user feedback
    let errorMessage = 'Failed to load seller profile. Please try again.'

    if (appError.status === 404) {
      errorMessage = 'Seller not found.'
    } else if (appError.message) {
      errorMessage = appError.message
    }

    // Log in development, use proper error tracking in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching seller data:', appError)
    } else {
      // In production, this would use a service like Sentry
      // Example: Sentry.captureException(appError);
    }
  }
}

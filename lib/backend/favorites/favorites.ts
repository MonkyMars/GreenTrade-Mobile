import api from 'lib/backend/api/axiosConfig'
import { AppError, retryOperation } from 'lib/errorUtils'

/**
 * Toggle a listing as favorite/unfavorite with proper error handling
 */
export const toggleFavorite = async (
  listingId: string,
  userId: string,
  state: boolean,
): Promise<boolean> => {
  try {
    // Use type-safe retry utility with the appropriate HTTP method
    const response = await retryOperation(
      () =>
        state
          ? api.delete(`/api/favorites/${listingId}/${userId}`)
          : api.post(`/api/favorites`, {
              listing_id: listingId,
              user_id: userId,
            }),
      {
        context: 'Updating favorites',
        maxRetries: 2,
        delayMs: 500,
        shouldRetry: error =>
          !!error.isNetworkError || !!(error.status && error.status >= 500),
      },
    )

    if (!response.data || !response.data.success) {
      throw new AppError(
        response.data?.message || 'Failed to update favorites',
        {
          code: 'UPDATE_FAILED',
          status: response.status,
        },
      )
    }

    // Return whether the item is now favorited or not
    const isNowFavorited = !state

    return isNowFavorited
  } catch (error) {
    // Convert to AppError if not already
    const appError =
      error instanceof AppError
        ? error
        : AppError.from(error, 'Updating favorites')

    // Create a user-friendly error message
    const errorMessage =
      appError.message || 'Failed to update favorites. Please try again.'

    // Log in development, use proper error tracking in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error updating favorites:', appError)
    } else {
      // In production, use proper error tracking
      // Example: Sentry.captureException(appError)
    }

    // Rethrow with improved message
    throw appError
  }
}

import { FetchedReview } from 'lib/types/review'
import api from '../api/axiosConfig'
import { AppError, retryOperation } from 'lib/errorUtils'

interface ApiResponse {
  success: boolean
  data: FetchedReview[]
  message?: string
}

export const getReviews = async (userId: string): Promise<FetchedReview[]> => {
  if (!userId) {
    throw new AppError('userId must be provided', {
      code: 'MISSING_PARAMETERS',
      status: 400,
    })
  }

  try {
    const response = await retryOperation(
      () => api.get<ApiResponse>(`/reviews/${userId}`),
      {
        context: 'Fetching reviews by user',
        maxRetries: 3,
      },
    )

    if (!response.data || !response.data.success) {
      throw new AppError('Failed to fetch reviews', {
        code: 'FETCH_FAILED',
        status: response.status,
      })
    }

    if (!Array.isArray(response.data.data)) {
      throw new AppError('Invalid data format received', {
        code: 'INVALID_RESPONSE',
        status: response.status,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews = response.data.data.map((review: any) => {
      return {
        id: review.id,
        rating: review.rating,
        userId: review.user_id,
        sellerId: review.seller_id,
        title: review.title,
        content: review.content,
        helpfulCount: review.helpful_count,
        verifiedPurchase: review.verified_purchase,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        userName: review.user_name,
      }
    })

    return reviews as FetchedReview[]
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching reviews:', error)
    }
    throw new AppError('An error occurred while fetching reviews', {
      code: 'FETCH_ERROR',
      status: 500,
    })
  }
}

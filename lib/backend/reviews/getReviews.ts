import { FetchedReview } from 'lib/types/main'
import api from '../api/axiosConfig'

export const getReviews = async (
  sellerId: string,
): Promise<FetchedReview[]> => {
  try {
    interface ApiResponse {
      success: boolean
      data: FetchedReview[]
      message?: string
    }

    const response = await api.get<ApiResponse>(`/api/reviews/${sellerId}`)

    if (!response.data.success) {
      throw new Error(
        response.data?.message ||
          `API request failed to fetch reviews for seller ${sellerId}`,
      )
    }

    if (!Array.isArray(response.data.data)) {
      throw new Error(`API response is not an array`)
    }

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

    return reviews
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve reviews: ${error.message}`)
    } else {
      throw new Error('An unknown error occurred while fetching reviews.')
    }
  }
}

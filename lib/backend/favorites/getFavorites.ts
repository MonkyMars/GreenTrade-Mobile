import { FetchedListing } from 'lib/types/main'
import api from '../api/axiosConfig'

export const getFavorites = async (
  userId: string,
): Promise<FetchedListing[]> => {
  try {
    const response = await api.get(`/api/favorites/${userId}`)

    const favorites: FetchedListing[] = response.data.data.map(
      (listing: any) => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        condition: listing.condition,
        location: listing.location,
        price: listing.price,
        negotiable: listing.negotiable,
        ecoScore: listing.ecoScore,
        ecoAttributes: listing.ecoAttributes,
        imageUrl: listing.imageUrl,
        createdAt: listing.created_at,
        sellerId: listing.seller_id,
        sellerCreatedAt: listing.seller_created_at,
        sellerUsername: listing.seller_username,
        sellerBio: listing.seller_bio,
        sellerRating: listing.seller_rating,
        sellerVerified: listing.seller_verified,
      }),
    )

    return favorites
  } catch (error) {
    console.error('Error fetching favorites:', error)
    throw error
  }
}

export const isFavoritedListing = async (
  listingId: string,
  userId: string,
): Promise<boolean> => {
  try {
    const response = await api.get(
      `/api/favorites/check/${listingId}/${userId}`,
    )
    if (!response.data || !response.data.success) {
      throw new Error('Failed to check favorite status')
    }

    return response.data.data as boolean
  } catch (error) {
    console.error('Error checking favorite status:', error)
    throw error
  }
}

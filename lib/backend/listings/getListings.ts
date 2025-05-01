import { FetchedListing } from 'lib/types/main'
import api from '../api/axiosConfig'

export const getListings = async (
  id?: string,
): Promise<FetchedListing | FetchedListing[]> => {
  try {
    if (id) {
      const response = await api.get(`/listings/${id}`)
      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch listing')
      }

      const listing = response.data.data as any

      const validListing: FetchedListing = {
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
      }

      return validListing
    } else {
      const response = await api.get(`/listings`)
      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch listings')
      }
      const all = response.data.data as any[]

      const validListings: FetchedListing[] = all.map(listing => {
        return {
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
        }
      })

      if (validListings.length === 0) {
        throw new Error('No valid listings found')
      }
      return validListings
    }
  } catch (error) {
    console.error('Error fetching listings:', error)
    throw new Error('Failed to fetch listings')
  }
}

export const getSellerListings = async (
  sellerId: string,
): Promise<FetchedListing[]> => {
  try {
    const response = await api.get(`/listings/seller/${sellerId}`)
    if (!response.data || !response.data.success) {
      throw new Error('Failed to fetch seller listings')
    }

    const all = response.data.data as any[]

    const validListings: FetchedListing[] = all.map(listing => {
      return {
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
      }
    })

    return validListings
  } catch (error) {
    console.error('Error fetching seller listings:', error)
    throw new Error('Failed to fetch seller listings')
  }
}

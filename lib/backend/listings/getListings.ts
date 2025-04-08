import { FetchedListing } from 'lib/types/main'
import api from '../api/axiosConfig'
import { isFetchedListing } from 'lib/functions/validateListing'

export const getListings = async (
  id?: number,
): Promise<FetchedListing | FetchedListing[]> => {
  try {
    if (id) {
      const response = await api.get(`/listings/${id}`)
      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch listing')
      }
      if (!isFetchedListing(response.data.data)) {
        throw new Error('Invalid listing format')
      }
      return response.data.data
    } else {
      const response = await api.get(`/listings`)
      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch listings')
      }
      const all = response.data.data as any[]
      const validListings = all.filter(isFetchedListing)
      return validListings
    }
  } catch (error) {
    console.error('Error fetching listings:', error)
    throw new Error('Failed to fetch listings')
  }
}

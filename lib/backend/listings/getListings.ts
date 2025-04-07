import { FetchedListing } from 'lib/types/main'
import api from '../api/axiosConfig'

export const getListings = async (
  id?: number,
): Promise<FetchedListing | FetchedListing[]> => {
  try {
    if (id) {
      const response = await api.get(`/listings/${id}`)
      return response.data as FetchedListing
    } else {
      const response = await api.get(`/listings`)
      return response.data.data as FetchedListing[]
    }
  } catch (error) {
    console.error('Error fetching listings:', error)
    throw new Error('Failed to fetch listings')
  }
}

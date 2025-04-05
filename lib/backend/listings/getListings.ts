import { FetchedListing } from 'lib/types/main'

export const getListings = async (
  id?: number,
): Promise<FetchedListing | FetchedListing[]> => {
  try {
    if (id) {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL_PUBLIC}/listings/${id}`,
      )
      const data = await response.json()
      return data.data as FetchedListing
    } else {
      const response = await fetch(`http://192.168.178.10:8080/listings`)
      const data = await response.json()
      return data.data as FetchedListing[]
    }
  } catch (error) {
    console.error('Error fetching listings:', error)
    throw new Error('Failed to fetch listings')
  }
}

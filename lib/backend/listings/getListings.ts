import { FetchedListing } from '../../types/main'

export const getListings = async (
  id?: number,
): Promise<FetchedListing | FetchedListing[]> => {
  if (id) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL_PUBLIC}/listings/${id}`,
    )
    const data = await response.json()
    return data.data as FetchedListing
  } else {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL_PUBLIC}/listings`,
    )
    const data = await response.json()
    return data.data as FetchedListing[]
  }
}

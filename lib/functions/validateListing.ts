import { FetchedListing } from 'lib/types/main'

export const isFetchedListing = (obj: any): obj is FetchedListing => {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.sellerUsername === 'string' &&
    typeof obj.sellerBio === 'string' &&
    typeof obj.sellerCreatedAt === 'string' &&
    Array.isArray(obj.ecoAttributes) &&
    Array.isArray(obj.imageUrl)
  )
}

import { FetchedListing } from 'lib/types/main'

export function isFetchedListing(item: any): item is FetchedListing {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'number' &&
    typeof item.created_at === 'string' &&
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.price === 'number' &&
    typeof item.location === 'string' &&
    typeof item.category === 'string' &&
    typeof item.condition === 'string' &&
    Array.isArray(item.ecoAttributes) &&
    item.ecoAttributes.every((attr: any) => typeof attr === 'string') &&
    typeof item.ecoScore === 'number' &&
    typeof item.negotiable === 'boolean' &&
    Array.isArray(item.imageUrl) &&
    item.imageUrl.every((url: any) => typeof url === 'string') &&
    typeof item.seller === 'object' &&
    item.seller !== null &&
    typeof item.seller.id === 'string' &&
    typeof item.seller.name === 'string' &&
    typeof item.seller.rating === 'number' &&
    typeof item.seller.verified === 'boolean'
  )
}

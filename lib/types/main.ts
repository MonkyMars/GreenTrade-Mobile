export type UploadListing = {
  title: string
  description: string
  category: string
  condition: string
  location: string
  price: number
  negotiable: boolean
  ecoScore: number
  ecoAttributes: string[]
  imageUrl: string[]

  sellerId: string
}

export interface FetchedListing extends UploadListing {
  id: string
  createdAt: string
  sellerUsername: string
  sellerBio: string
  sellerCreatedAt: string
  sellerRating: number
  sellerVerified: boolean
}

export interface Seller {
  id: string
  name: string
  rating: string | number
  verified: boolean
  bio: string
  createdAt: string
}

export type UploadListing = {
  title: string
  description: string
  category: string
  condition: string
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
  location: string
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

export interface Review {
  rating: number
  userId: string
  sellerId: string
  title: string
  content: string
  helpfulCount: number
  verifiedPurchase: boolean
}

export interface FetchedReview extends Review {
  id: string
  createdAt: string
  updatedAt: string
  userName: string
}

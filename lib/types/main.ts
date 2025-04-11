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
  createdAt: string
  sellerUsername: string
  sellerBio: string
  sellerCreatedAt: string
}

export interface FetchedListing extends UploadListing {
  id: number
  created_at: string
}

export interface Seller {
  name: string
  rating: string | number
  verified: boolean
  bio?: string
}

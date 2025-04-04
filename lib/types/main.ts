export interface Listing {
  id: number
  title: string
  description: string
  image: string
  price: string
  ecoScore: number
  location: string
  category: string
  date: string
  condition: string
  isFavorite: boolean
  seller: {
    name: string
    rating: number
    verified: boolean
  }
}

export interface UploadListing {
  title: string
  description: string
  price: number
  location: string
  category: string
  condition: string
  ecoAttributes: string[]
  ecoScore: number
  negotiable: boolean
  imageUrl: string[]
  seller: {
    id: number
    name: string
    rating: number
    verified: boolean
  }
}

export interface FetchedListing extends UploadListing {
  id: number
  created_at: string
}

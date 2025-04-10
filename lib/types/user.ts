export interface User {
  id: string
  name: string
  email: string
  location: string
  isSeller: boolean
  profileUrl: string
  created_at: string
  updated_at: string
  profileImage?: string
  bio: string
  ecoScore?: number
}

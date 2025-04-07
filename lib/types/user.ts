export interface User {
  id: string
  name: string
  email: string
  location: string
  isSeller: boolean
  profileUrl: string
  createdAt: string
  updatedAt: string
  phone?: string
  profileImage?: string
  bio?: string
  ecoScore?: number
}

import api from '../api/axiosConfig'
import { User } from 'lib/types/user'

export const getUser = async (uuid: string) => {
  try {
    const response = await api.get(`/api/auth/user/${uuid}`)
    if (!response.data || !response.data.data || !response.data.data.user) {
      throw new Error('Invalid user data received')
    }
    const user = response.data.data.user
    return user
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}

export const updateUser = async (
  uuid: string,
  userData: {
    name: string
    location: string
    bio?: string
  },
) => {
  try {
    const response = await api.put(`/api/auth/user/${uuid}`, userData)

    if (!response.data.success) {
      throw new Error('Failed to update user data')
    }

    if (!response.data.data) {
      throw new Error('Invalid user data received')
    }
    const user = response.data.data as User
    return user
  } catch (error) {
    console.error('Error updating user data:', error)
    throw error as Error
  }
}

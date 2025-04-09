import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/axiosConfig'

export const getUser = async (uuid: string) => {
  try {
    // We don't need to manually set the Authorization header here anymore
    // because we've set up the axios interceptor to do this automatically
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

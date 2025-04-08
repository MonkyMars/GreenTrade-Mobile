import AsyncStorage from '@react-native-async-storage/async-storage'
import { UploadListing } from '../../types/main'
import api from '../api/axiosConfig'

export const uploadListing = async (listing: UploadListing) => {
  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required. Please log in.')
    }

    const response = await api.post('/api/listings', listing, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    console.log('Upload response:', response.data)
    if (!response.data.success) throw new Error('Failed to upload listing')

    return response.data.data
  } catch (error) {
    console.error('Upload listing error:', error)
    throw error
  }
}

import { UploadListing } from '../../types/main'
import api from '../api/axiosConfig'

export const uploadListing = async (listing: UploadListing) => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required. Please log in.')
    }

    const response = await api.post('/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(listing),
    })

    if (!response.data.success) throw new Error('Failed to upload listing')

    return await response.data.data
  } catch (error) {
    console.error(error)
    throw error // Re-throw the error to be handled by the caller
  }
}

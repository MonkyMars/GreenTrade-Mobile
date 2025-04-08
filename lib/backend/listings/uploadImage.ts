import AsyncStorage from '@react-native-async-storage/async-storage'
import { UploadListing } from '../../types/main'
import api from '../api/axiosConfig'

export const uploadImage = async (
  images: { uri: string; type?: string; name?: string }[],
  listing_title: UploadListing['title'],
) => {
  if (!images || images.length === 0) {
    throw new Error('No images provided')
  }

  const formData = new FormData()
  formData.append('listing_title', listing_title)

  images.forEach((image, index) => {
    const file = {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.name || `image-${index}.jpg`,
    }
    formData.append(`file${index}`, file as any)
  })

  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required. Please log in.')
    }

    console.log('Uploading images to /api/upload/listing_image')

    const response = await api.post('/api/upload/listing_image', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })

    console.log('Image upload response:', response.data)

    if (!response.data.success) {
      throw new Error(
        'Failed to upload image: Server returned unsuccessful response',
      )
    }

    // If the response data is empty but success is true, return the original image URIs
    if (!response.data.data || response.data.data.length === 0) {
      console.log('No URLs returned from server, using original image URIs')
      return images.map(img => img.uri)
    }

    // If we have URLs in the response, use those
    if (Array.isArray(response.data.data)) {
      return response.data.data
    }

    // If we have a different format, try to extract URLs
    if (response.data.data.urls && Array.isArray(response.data.data.urls)) {
      return response.data.data.urls
    }

    throw new Error('Invalid response format from server')
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

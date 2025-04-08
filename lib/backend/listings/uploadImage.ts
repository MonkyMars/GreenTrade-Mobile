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

  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      throw new Error('Authentication required. Please log in.')
    }

    // Create a single FormData object for all images
    const formData = new FormData()
    formData.append('listing_title', listing_title)

    // The backend expects files with the key "file" (not "file0", "file1", etc.)
    images.forEach(image => {
      formData.append('file', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || `image-${Date.now()}.jpg`,
      } as any)
    })

    console.log('Uploading images to /api/upload/listing_image')

    // Use the correct endpoint that matches the backend Go code
    const response = await api.post('/api/upload/listing_image', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })

    console.log('Image upload response:', response.data)

    // Check if the response has the expected format
    if (!response.data || !response.data.success) {
      console.error('Unexpected response format:', response.data)
      throw new Error('Invalid response format from server')
    }

    // Extract URLs from the response
    let urls: string[] = []

    // If the response data is empty but success is true, use the original image URIs
    if (!response.data.data || response.data.data.length === 0) {
      console.log('No URLs returned from server, using original image URIs')
      urls = images.map(img => img.uri)
    }
    // If we have URLs in the response as an array
    else if (Array.isArray(response.data.data)) {
      urls = response.data.data
    }
    // If we have a different format with urls property
    else if (
      response.data.data.urls &&
      Array.isArray(response.data.data.urls)
    ) {
      urls = response.data.data.urls
    }
    // If we have a single URL string
    else if (typeof response.data.data === 'string') {
      urls = [response.data.data]
    } else {
      console.error('Unexpected response format:', response.data)
      throw new Error('Invalid response format from server')
    }

    console.log('Successfully uploaded images, received URLs:', urls)

    // Return the URLs in the format expected by the listing creation
    return { urls }
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

import { UploadListing } from 'lib/types/main'
import api from 'lib/backend/api/axiosConfig'
import { AppError, retryOperation } from 'lib/errorUtils'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const uploadImage = async (
  images: { uri: string; type?: string; name?: string }[],
  listing_title: UploadListing['title'],
) => {
  if (!images || images.length === 0) {
    throw new AppError('No images provided', {
      code: 'NO_IMAGES',
      status: 400,
    })
  }

  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      throw new AppError('Authentication required. Please log in.', {
        code: 'AUTH_REQUIRED',
        status: 401,
      })
    }

    const formData = new FormData()
    formData.append('listing_title', listing_title)

    // Append each image using React Native-compatible format
    images.forEach((image, index) => {
      if (!image.uri) {
        console.warn('Invalid image object:', image)
        return
      }

      formData.append('file', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || `image-${Date.now()}-${index}.jpg`,
      } as any) // `as any` to satisfy TS + RN FormData
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log('Uploading images to /api/upload/listing_image')
    }

    const response = await retryOperation(
      () =>
        api.post('/api/upload/listing_image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }),
      {
        context: 'Uploading images',
        maxRetries: 3,
        showToastOnRetry: false,
      },
    )

    if (process.env.NODE_ENV !== 'production') {
      console.log('Image upload response:', response.data)
    }

    const data = response.data

    if (!data || !data.success) {
      throw new AppError(
        data?.message || 'Invalid response format from server',
        {
          code: 'INVALID_RESPONSE',
          status: response.status,
        },
      )
    }

    let urls: string[] = []

    if (!data.data || data.data.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('No URLs returned from server, using original image URIs')
      }
      urls = images.map(img => img.uri)
    } else if (Array.isArray(data.data)) {
      urls = data.data
    } else if (data.data.urls && Array.isArray(data.data.urls)) {
      urls = data.data.urls
    } else if (typeof data.data === 'string') {
      urls = [data.data]
    } else {
      throw new AppError('Invalid response format from server', {
        code: 'INVALID_RESPONSE_FORMAT',
        status: response.status,
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Successfully uploaded images, received URLs:', urls)
    }

    return { urls }
  } catch (error) {
    const appError =
      error instanceof AppError ? error : AppError.from(error, 'Image upload')

    if (process.env.NODE_ENV !== 'production') {
      console.error('Image upload error:', appError)
    }

    throw appError
  }
}

import { UploadListing } from 'lib/types/main'
import api from 'lib/backend/api/axiosConfig'
import { AppError, retryOperation } from 'lib/errorUtils'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const uploadImage = async (
  images: { uri: string; type?: string; name?: string }[],
  listing_title: UploadListing['title'],
) => {
  if (!images || images.length === 0) {
    const errorMessage = 'No images provided'
    throw new AppError(errorMessage, {
      code: 'NO_IMAGES',
      status: 400,
    })
  }

  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (!token) {
      const errorMessage = 'Authentication required. Please log in.'
      throw new AppError(errorMessage, {
        code: 'AUTH_REQUIRED',
        status: 401,
      })
    }

    // Create a single FormData object for all images
    const formData = new FormData()
    formData.append('listing_title', listing_title)

    // The backend expects files with the key "file" (not "file0", "file1", etc.)
    await Promise.all(
      images.map(async (image, index) => {
        try {
          // Check if we have a URL/URI or a File object
          if (image instanceof File) {
            // If it's already a File object, just append it
            formData.append('file', image)
          } else if (image.uri) {
            // For NextJS, convert the URI to a File object
            const response = await fetch(image.uri)
            const blob = await response.blob()

            // Create a File object from the blob
            const file = new File(
              [blob],
              image.name || `image-${Date.now()}-${index}.jpg`,
              { type: image.type || 'image/jpeg' },
            )

            // Append the file to the FormData
            formData.append('file', file)

            if (process.env.NODE_ENV !== 'production') {
              console.log(
                `Converted image URI to File: ${file.name}, size: ${file.size}`,
              )
            }
          } else {
            console.warn('Invalid image object:', image)
          }
        } catch (err) {
          console.error(`Error processing image ${index}:`, err)
          // Continue with other images even if one fails
        }
      }),
    )

    if (process.env.NODE_ENV !== 'production') {
      console.log('Uploading images to /api/upload/listing_image')
    }

    // Use our new strongly-typed retry function
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
        showToastOnRetry: false, // We'll handle this with our own loading state
      },
    )

    if (process.env.NODE_ENV !== 'production') {
      console.log('Image upload response:', response.data)
    }

    // Check if the response has the expected format
    if (!response.data || !response.data.success) {
      const errorMessage =
        response.data?.message || 'Invalid response format from server'
      throw new AppError(errorMessage, {
        code: 'INVALID_RESPONSE',
        status: response.status,
      })
    }

    // Extract URLs from the response
    let urls: string[] = []

    // If the response data is empty but success is true, use the original image URIs
    if (!response.data.data || response.data.data.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('No URLs returned from server, using original image URIs')
      }
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
      const errorMessage = 'Invalid response format from server'
      throw new AppError(errorMessage, {
        code: 'INVALID_RESPONSE_FORMAT',
        status: response.status,
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Successfully uploaded images, received URLs:', urls)
    }

    // Return the URLs in the format expected by the listing creation
    return { urls }
  } catch (error) {
    // Convert to AppError if not already
    const appError =
      error instanceof AppError ? error : AppError.from(error, 'Image upload')

    // Log in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Image upload error:', appError)
    } else {
      // In production, use proper error tracking
      // Example: Sentry.captureException(appError)
    }

    // Rethrow for component handling
    throw appError
  }
}

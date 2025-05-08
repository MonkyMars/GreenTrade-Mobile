import axios, { AxiosError } from 'axios'

/**
 * Type for API error responses from the backend
 */
export interface ApiErrorResponse {
  success: false
  message: string
  code?: string
  errors?: Record<string, string[]>
  status?: number
}

/**
 * Extended Error type that includes API error details
 */
export class AppError extends Error {
  public readonly code?: string
  public readonly status?: number
  public readonly isAxiosError: boolean
  public readonly isNetworkError: boolean
  public readonly validationErrors?: Record<string, string[]>
  public readonly context?: string

  constructor(
    message: string,
    options: {
      code?: string
      status?: number
      isAxiosError?: boolean
      isNetworkError?: boolean
      validationErrors?: Record<string, string[]>
      context?: string
    } = {},
  ) {
    super(message)
    this.name = 'AppError'
    this.code = options.code
    this.status = options.status
    this.isAxiosError = options.isAxiosError || false
    this.isNetworkError = options.isNetworkError || false
    this.validationErrors = options.validationErrors
    this.context = options.context

    // Ensures proper instanceof checks work in TypeScript
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * Create an AppError from an axios error
   */
  static fromAxiosError(
    error: AxiosError<ApiErrorResponse>,
    context?: string,
  ): AppError {
    let message = 'An unexpected error occurred'
    let status: number | undefined
    let code: string | undefined
    let validationErrors: Record<string, string[]> | undefined

    if (error.response) {
      // The server responded with a status code outside of 2xx range
      const data = error.response.data
      status = error.response.status

      if (typeof data === 'object' && data !== null) {
        message = data.message || `Server error (${status})`
        code = data.code
        validationErrors = data.errors
      }
    } else if (error.request) {
      // The request was made but no response was received
      message = 'Network error - please check your connection'
      code = 'NETWORK_ERROR'
    } else {
      // Something happened in setting up the request
      message = error.message || 'Error setting up the request'
    }

    return new AppError(message, {
      code,
      status,
      isAxiosError: true,
      isNetworkError: !error.response,
      validationErrors,
      context,
    })
  }

  /**
   * Create an AppError from any error
   */
  static from(error: unknown, context?: string): AppError {
    if (error instanceof AppError) {
      // If it's already an AppError, just update the context if provided
      if (context && !error.context) {
        // Create a new error with the context included instead of modifying readonly property
        return new AppError(error.message, {
          code: error.code,
          status: error.status,
          isAxiosError: error.isAxiosError,
          isNetworkError: error.isNetworkError,
          validationErrors: error.validationErrors,
          context,
        })
      }
      return error
    }

    if (axios.isAxiosError(error)) {
      return AppError.fromAxiosError(error, context)
    }

    if (error instanceof Error) {
      return new AppError(error.message, { context })
    }

    // For primitives or unknown structures
    const message =
      typeof error === 'string' ? error : 'An unknown error occurred'

    return new AppError(message, { context })
  }
}

/**
 * Type-safe error handler with proper error categorization and logging
 */
export function handleError(
  error: unknown,
  context: string,
  options: {
    throwError?: boolean
    showToast?: boolean
    logError?: boolean
  } = {},
): AppError {
  const {
    throwError = false,
    showToast = true,
    logError = process.env.NODE_ENV !== 'production',
  } = options

  const appError = AppError.from(error, context)

  // Add context to the error message if not already included
  const displayMessage =
    appError.context && !appError.message.includes(appError.context)
      ? `${appError.context}: ${appError.message}`
      : appError.message

  // Log error in development or if explicitly requested
  if (logError) {
    console.error(`[${context}]`, appError)

    // Log validation errors if present
    if (appError.validationErrors) {
      console.error('Validation errors:', appError.validationErrors)
    }
  }

  // Track error in production systems
  if (process.env.NODE_ENV === 'production') {
    // In a real app, you would use a service like Sentry here
    // Example: Sentry.captureException(appError);
  }

  // Optionally rethrow for component handling
  if (throwError) {
    throw appError
  }

  return appError
}

/**
 * Type-safe retry function with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    delayMs?: number
    context?: string
    shouldRetry?: (error: AppError, attempt: number) => boolean
    onRetry?: (error: AppError, attempt: number) => void
    showToastOnRetry?: boolean
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    context = 'API operation',
    shouldRetry = error =>
      !error.validationErrors &&
      (error.isNetworkError || (error.status && error.status >= 500)),
    onRetry,
    showToastOnRetry = true,
  } = options

  let lastError: AppError | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      // Convert to AppError
      lastError = AppError.from(error, context)

      // Log retry attempt in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `${context} failed (attempt ${attempt + 1}/${maxRetries}):`,
          lastError,
        )
      }

      // Check if we should retry this error
      if (attempt < maxRetries - 1 && shouldRetry(lastError, attempt)) {
        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(lastError, attempt)
        }

        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // We're not retrying anymore, so break out of the loop
        break
      }
    }
  }

  // If we get here, all retries failed
  if (!lastError) {
    // This should never happen, but just in case
    lastError = new AppError(`${context} failed after ${maxRetries} attempts`, {
      context,
    })
  }

  // Final error handling
  handleError(lastError, `${context} failed after ${maxRetries} attempts`)
  throw lastError
}

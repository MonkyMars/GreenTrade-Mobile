import { FetchedListing } from 'lib/types/main'
import api from 'lib/backend/api/axiosConfig'
import { AppError, retryOperation } from 'lib/errorUtils'
import { ReactElement } from 'react'

/**
 * Fetch a single listing or all listings with improved error handling and retry logic
 */
export const getListings = async (
	id?: string,
	limit?: number
): Promise<FetchedListing | FetchedListing[]> => {
	try {
		if (id) {
			try {
				// Use our type-safe retry utility
				const response = await retryOperation(
					() => api.get(`/listings/${id}`),
					{
						context: "Fetching listing details",
						maxRetries: 3,
						delayMs: 1000,
						shouldRetry: (error) => !!error.isNetworkError || !!(error.status && error.status >= 500)
					}
				)

				if (!response.data || !response.data.success) {
					throw new AppError(response.data?.message || 'Failed to fetch listing', {
						code: 'FETCH_FAILED',
						status: response.status
					})
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const listing = response.data.data as any

				const validListing: FetchedListing = {
					id: listing.id,
					title: listing.title,
					description: listing.description,
					category: listing.category,
					condition: listing.condition,
					location: listing.location,
					price: listing.price,
					negotiable: listing.negotiable,
					ecoScore: listing.ecoScore,
					ecoAttributes: listing.ecoAttributes,
					imageUrl: listing.imageUrl,
					createdAt: listing.created_at,
					sellerId: listing.seller_id,
					sellerCreatedAt: listing.seller_created_at,
					sellerUsername: listing.seller_username,
					sellerBio: listing.seller_bio,
					sellerRating: listing.seller_rating,
					sellerVerified: listing.seller_verified,
				}

				return validListing
			} catch (error) {
				throw error // Re-throw to be handled by the outer catch
			}
		} else {
			// Use our type-safe retry utility
			const response = await retryOperation(
				() => api.get(`/listings?limit=${limit || 50}`),
				{
					context: "Fetching listings",
					maxRetries: 3
				}
			)

			if (!response.data.success) {
				throw new AppError(response.data?.message || 'Failed to fetch listings', {
					code: 'FETCH_FAILED',
					status: response.status
				})
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const all = response.data.data as any[]

			const validListings: FetchedListing[] = all.map(listing => {
				return {
					id: listing.id,
					title: listing.title,
					description: listing.description,
					category: listing.category,
					condition: listing.condition,
					location: listing.location,
					price: listing.price,
					negotiable: listing.negotiable,
					ecoScore: listing.ecoScore,
					ecoAttributes: listing.ecoAttributes,
					imageUrl: listing.imageUrl,
					createdAt: listing.created_at,
					sellerId: listing.seller_id,
					sellerCreatedAt: listing.seller_created_at,
					sellerUsername: listing.seller_username,
					sellerBio: listing.seller_bio,
					sellerRating: listing.seller_rating,
					sellerVerified: listing.seller_verified,
				}
			})

			return validListings
		}
	} catch (error) {
		// Convert to AppError if not already
		const appError = error instanceof AppError
			? error
			: AppError.from(error, id ? 'Fetching listing details' : 'Fetching listings');

		// Create a user-friendly error message based on the error details
		let errorMessage: string;

		if (appError.status === 404) {
			errorMessage = id
				? 'Listing not found. It may have been removed.'
				: 'No listings found.';
		} else {
			errorMessage = appError.message || 'Failed to fetch listings. Please try again later.';
		}

		// Log in development, use proper error tracking in production
		if (process.env.NODE_ENV !== 'production') {
			console.error('Error fetching listings:', appError);
		} else {
			// In production, use proper error tracking
			// Example: Sentry.captureException(appError)
		}

		// Rethrow with improved message
		throw appError;
	}
}

/**
 * Fetch listings from a specific seller with improved error handling
 */
export const getSellerListings = async (
	sellerId: string,
): Promise<FetchedListing[]> => {
	try {
		// Use our type-safe retry utility
		const response = await retryOperation(
			() => api.get(`/listings/seller/${sellerId}`),
			{
				context: "Fetching seller listings",
				maxRetries: 3,
				showToastOnRetry: false // We have our own loading state
			}
		)

		if (!response.data || !response.data.success) {
			throw new AppError(response.data?.message || 'Failed to fetch seller listings', {
				code: 'FETCH_FAILED',
				status: response.status
			})
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const all = response.data.data as any[]

		const validListings: FetchedListing[] = all.map(listing => {
			return {
				id: listing.id,
				title: listing.title,
				description: listing.description,
				category: listing.category,
				condition: listing.condition,
				location: listing.location,
				price: listing.price,
				negotiable: listing.negotiable,
				ecoScore: listing.ecoScore,
				ecoAttributes: listing.ecoAttributes,
				imageUrl: listing.imageUrl,
				createdAt: listing.created_at,
				sellerId: listing.seller_id,
				sellerCreatedAt: listing.seller_created_at,
				sellerUsername: listing.seller_username,
				sellerBio: listing.seller_bio,
				sellerRating: listing.seller_rating,
				sellerVerified: listing.seller_verified,
			}
		})

		return validListings
	} catch (error) {
		// Convert to AppError if not already
		const appError = error instanceof AppError
			? error
			: AppError.from(error, 'Fetching seller listings');

		// Create a user-friendly error message based on the error details
		let errorMessage: string;

		if (appError.status === 404) {
			errorMessage = 'Seller not found or has no listings.';
		} else {
			errorMessage = appError.message || 'Failed to fetch seller listings. Please try again later.';
		}

		// Log in development, use proper error tracking in production
		if (process.env.NODE_ENV !== 'production') {
			console.error('Error fetching seller listings:', appError);
		}
		// Rethrow with improved message
		throw appError;
	}
}

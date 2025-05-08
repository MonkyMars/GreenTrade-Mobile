import api from "lib/backend/api/axiosConfig";
import { AppError, retryOperation } from "lib/errorUtils";
import { FetchedListing } from "lib/types/main";
import React from "react";

/**
 * Fetch user's favorite listings with proper error handling
 */
export const getFavorites = async (
	userId: string
): Promise<FetchedListing[]> => {
	try {
		// Use type-safe retry utility
		const response = await retryOperation(
			() => api.get(`/api/favorites/${userId}`),
			{
				context: "Fetching favorites",
				maxRetries: 3,
				delayMs: 800,
				shouldRetry: (error) =>
					!!error.isNetworkError || !!(error.status && error.status >= 500),
			}
		);

		if (!response.data || !response.data.success) {
			throw new AppError(
				response.data?.message || "Failed to fetch favorites",
				{
					code: "FETCH_FAILED",
					status: response.status,
				}
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const favoritesData = response.data.data as any[];

		const favorites: FetchedListing[] = favoritesData.map((listing) => {
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
			};
		});

		return favorites;
	} catch (error) {
		// Convert to AppError if not already
		const appError =
			error instanceof AppError
				? error
				: AppError.from(error, "Fetching favorites");

		// Create a user-friendly error message
		const errorMessage =
			appError.message ||
			"Failed to fetch your favorites. Please try again later.";

		// Log in development, use proper error tracking in production
		if (process.env.NODE_ENV !== "production") {
			console.error("Error fetching favorites:", appError);
		} else {
			// In production, use proper error tracking
			// Example: Sentry.captureException(appError)
		}

		// Rethrow with improved message
		throw appError;
	}
};

export const isFavorite = async (
	listingId: string,
	userId: string
): Promise<boolean> => {
	try {
		const response = await api.get(`/api/favorites/check/${listingId}/${userId}`);
		if (!response.data || !response.data.success) {
			throw new AppError(
				response.data?.message || "Failed to check favorite status",
				{
					code: "CHECK_FAILED",
					status: response.status,
				}
			);
		}

		return response.data.data as boolean;
	} catch (error) {
		// Convert to AppError if not already
		const appError =
			error instanceof AppError
				? error
				: AppError.from(error, "Checking favorite status");

		// Log in development, use proper error tracking in production
		if (process.env.NODE_ENV !== "production") {
			console.error("Error checking favorite status:", appError);
		} else {
			// In production, use proper error tracking
			// Example: Sentry.captureException(appError)
		}

		// Rethrow with improved message
		throw appError;
	}
};

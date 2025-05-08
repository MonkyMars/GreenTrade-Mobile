"use client";
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	useCallback,
} from "react";
import axios from "axios";
import { User } from "../types/user";
import api from "../backend/api/axiosConfig";
import { getUser } from "lib/backend/auth/user";
import { AppError, handleError, retryOperation } from "lib/errorUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (
		name: string,
		email: string,
		password: string,
		location: string
	) => Promise<void>;
	logout: () => void;
	isAuthenticated: boolean;
	refreshTokens: () => Promise<boolean>;
	reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	// Add refs to track refresh state
	const refreshInProgress = useRef(false);
	const refreshAttempts = useRef(0);
	const maxRefreshAttempts = 3;
	const lastRefreshTime = useRef(0);

	// Function to refresh access token
	const refreshTokens = useCallback(async (): Promise<boolean> => {
		// Prevent concurrent refresh attempts
		if (refreshInProgress.current) {
			if (process.env.NODE_ENV !== 'production') {
				console.log("Token refresh already in progress, skipping...");
			}
			return false;
		}

		// Implement rate limiting 
		const now = new Date().getTime();
		const timeSinceLastRefresh = now - lastRefreshTime.current;
		if (lastRefreshTime.current > 0 && timeSinceLastRefresh < 5000) {
			// Increased to 5 seconds
			if (process.env.NODE_ENV !== 'production') {
				console.log(
					`Rate limiting refresh (${timeSinceLastRefresh}ms since last attempt)`
				);
			}
			return false;
		}
		lastRefreshTime.current = now;

		// Check max attempts
		if (refreshAttempts.current >= maxRefreshAttempts) {
			handleError(
				new AppError(`Maximum refresh attempts (${maxRefreshAttempts}) reached`, {
					code: 'MAX_REFRESH_ATTEMPTS'
				}),
				"Authentication"
			);
			await logout();
			return false;
		}

		refreshAttempts.current += 1;
		refreshInProgress.current = true;

		try {
			const refreshToken = await AsyncStorage.getItem("refreshToken");

			if (!refreshToken) {
				throw new AppError("No refresh token found", { code: 'TOKEN_MISSING' });
			}

			if (process.env.NODE_ENV !== 'production') {
				console.log(
					"Attempting to refresh token with:",
					refreshToken.substring(0, 10) + "..."
				);
			}

			// Match the backend's expected format exactly
			const response = await api.post(
				`/auth/refresh`,
				{ refreshToken } // This needs to match your backend's expected structure
			);

			// Match your backend response structure
			const {
				accessToken,
				refreshToken: newRefreshToken,
				expiresIn,
			} = response.data.data;

			if (!accessToken || !newRefreshToken) {
				throw new AppError("Invalid refresh token response", { code: 'INVALID_TOKEN_RESPONSE' });
			}

			// Store the new tokens
			await AsyncStorage.setItem("accessToken", accessToken);
			await AsyncStorage.setItem("refreshToken", newRefreshToken);

			// Store the expiration time
			const expirationTime = new Date().getTime() + expiresIn * 1000;
			await AsyncStorage.setItem("tokenExpiration", expirationTime.toString());

			// Give a small delay to ensure the token is properly stored
			// before the next request uses it
			await new Promise((resolve) => setTimeout(resolve, 50));

			if (process.env.NODE_ENV !== 'production') {
				console.log("Token refresh successful");
			}
			// Reset attempt counter on success
			refreshAttempts.current = 0;

			return true;
		} catch (error) {
			// Use our properly typed handleError helper
			handleError(error, "Token refresh failed");

			// Progressive backoff on failures
			await new Promise((resolve) =>
				setTimeout(resolve, Math.min(1000 * refreshAttempts.current, 5000))
			);

			// Only clear auth state after max attempts
			if (refreshAttempts.current >= maxRefreshAttempts) {
				if (process.env.NODE_ENV !== 'production') {
					console.log("Max refresh attempts reached, logging out");
				}
				await AsyncStorage.removeItem("accessToken");
				await AsyncStorage.removeItem("refreshToken");
				await AsyncStorage.removeItem("userId");
				await AsyncStorage.removeItem("tokenExpiration");

				delete api.defaults.headers.common["Authorization"];
				setUser(null);
			}

			return false;
		} finally {
			refreshInProgress.current = false;
		}
	}, []);

	// Fix the axios interceptor to avoid infinite refresh loops
	useEffect(() => {
		const interceptor = api.interceptors.response.use(
			(response) => response,
			async (error) => {
				const originalRequest = error.config;

				// Prevent infinite retry loops - check retry flag and status code
				if (
					error.response?.status === 401 &&
					!originalRequest._retry &&
					refreshAttempts.current < maxRefreshAttempts
				) {
					originalRequest._retry = true;

					try {
						if (process.env.NODE_ENV !== 'production') {
							console.log("401 error detected, attempting token refresh");
						}
						const refreshSuccess = await refreshTokens();
						if (refreshSuccess) {
							// Retry the original request with new token
							// Get the latest token to ensure we're using the most recent one
							const token = await AsyncStorage.getItem("accessToken");
							if (!token) {
								throw new AppError("Failed to get new access token after refresh", {
									code: 'TOKEN_REFRESH_FAILED'
								});
							}

							// Use the fresh token for the retried request
							originalRequest.headers["Authorization"] = `Bearer ${token}`;

							// Small delay to ensure token is available
							await new Promise((resolve) => setTimeout(resolve, 50));

							// Return the retried request
							return api(originalRequest);
						} else {
							if (process.env.NODE_ENV !== 'production') {
								console.log("Token refresh failed, rejecting original request");
							}
						}
					} catch (refreshError) {
						handleError(refreshError, "Authentication refresh");
					}
				}

				return Promise.reject(error);
			}
		);

		// Clean up interceptor on unmount
		return () => {
			api.interceptors.response.eject(interceptor);
		};
	}, [refreshTokens]);

	// Check if user is logged in on initial load
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const token = await AsyncStorage.getItem("accessToken");
				const expirationTime = await AsyncStorage.getItem("tokenExpiration");

				if (!token) {
					setLoading(false);
					return;
				}

				// Check if token is expired
				if (expirationTime) {
					const now = new Date().getTime();
					const expiration = parseInt(expirationTime, 10);

					// If token is expired or about to expire (within 60 seconds), refresh it
					if (now >= expiration - 60000) {
						const refreshSuccess = await refreshTokens();
						if (!refreshSuccess) {
							setLoading(false);
							return;
						}
					}
				}

				// Configure axios to use the token
				api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

				// Fetch user data
				const userId = await AsyncStorage.getItem("userId");
				if (!userId) {
					throw new AppError("User ID not found", { code: 'USER_ID_MISSING' });
				}

				try {
					// Use retry operation for API call
					const response = await retryOperation(
						() => api.get(`/api/auth/user/${userId}`),
						{
							maxRetries: 3,
							delayMs: 1000,
							context: "User authentication"
						}
					);

					if (!response.data.success) {
						throw new AppError("Failed to fetch user data", { code: 'USER_FETCH_FAILED' });
					}

					const mappedUser = {
						...response.data.data.user,
						createdAt: response.data.data.user.created_at,
						lastSignInAt: response.data.data.user.last_sign_in_at,
					}

					setUser(mappedUser);
				} catch (apiError) {
					// If retries fail, handle it gracefully
					handleError(apiError, "Authentication validation");
					throw apiError; // Rethrow to trigger the catch block below
				}
			} catch (error) {
				// Clear tokens on authentication error
				if (process.env.NODE_ENV !== 'production') {
					console.error("Authentication error:", error);
				}
				await AsyncStorage.removeItem("accessToken");
				await AsyncStorage.removeItem("refreshToken");
				await AsyncStorage.removeItem("userId");
				await AsyncStorage.removeItem("tokenExpiration");
			} finally {
				setLoading(false);
			}
		};

		checkAuthStatus();
	}, [refreshTokens]);

	// Login function
	const login = async (email: string, password: string) => {
		// Don't set global loading state to true here
		// This allows the login component to control its own loading state
		try {
			if (process.env.NODE_ENV !== 'production') {
				console.log("Attempting login for:", email);
			}

			// Use retry operation for API call
			const response = await retryOperation(
				() => api.post(`/auth/login`, { email, password }),
				{
					maxRetries: 2, // Fewer retries for login to avoid lockouts
					delayMs: 800,
					context: "Login attempt"
				}
			);

			// Check if the response has an error message
			if (!response.data.success) {
				throw new AppError(response.data.message || "Login failed", { code: 'LOGIN_FAILED' });
			}

			if (!response.data || !response.data.data) {
				throw new AppError("Invalid login response format", { code: 'INVALID_RESPONSE_FORMAT' });
			}

			// Check response format based on your API
			const { accessToken, refreshToken, userId, expiresIn } =
				response.data.data;

			api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

			console.log(accessToken)

			if (!accessToken) {
				throw new AppError("Missing authentication token", { code: 'TOKEN_MISSING' });
			}

			// Store tokens
			await AsyncStorage.setItem("accessToken", accessToken);
			if (refreshToken) {
				await AsyncStorage.setItem("refreshToken", refreshToken);
			}
			await AsyncStorage.setItem("userId", userId);

			// Store token expiration time if provided
			if (expiresIn) {
				const expirationTime = new Date().getTime() + expiresIn * 1000;
				await AsyncStorage.setItem("tokenExpiration", expirationTime.toString());
			}

			// Set auth header for future requests


			// Set user data
			const user = await getUser(userId);

			if (!user) {
				throw new AppError("User not found", { code: 'USER_NOT_FOUND' });
			}

			// Update user state - this will trigger navigation due to authentication state change
			setUser(user);

			// Show success message
		} catch (error) {
			// Handle error and clean up any partial auth state
			await AsyncStorage.removeItem("accessToken");
			await AsyncStorage.removeItem("refreshToken");
			await AsyncStorage.removeItem("userId");
			await AsyncStorage.removeItem("tokenExpiration");

			// Handle common errors and expose appropriate messages for user login experience
			let errorMessage = "Login failed. Please try again.";

			if (axios.isAxiosError(error)) {
				if (error.response) {
					// Server responded with an error status code
					if (error.response.status === 401) {
						errorMessage = "Invalid email or password. Please try again.";
					} else if (error.response.data && error.response.data.message) {
						errorMessage = error.response.data.message;
					} else if (error.response.status >= 500) {
						errorMessage = "Server error. Please try again later.";
					}
				} else if (error.request) {
					// No response received
					errorMessage = "Network error. Please check your connection.";
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			// Log in development, use proper error tracking in production
			if (process.env.NODE_ENV !== 'production') {
				console.error("Login failed:", error);
			} else {
				// In production, this would use a service like Sentry
				// Example: Sentry.captureException(error);
			}

			// Rethrow for component handling with standardized message
			throw new Error(errorMessage);
		}
	};

	// Register function
	const register = async (
		name: string,
		email: string,
		password: string,
		location: string
	) => {
		try {
			setLoading(true);

			// Use retry operation for API call
			const response = await retryOperation(
				() => api.post(`/auth/register`, {
					name,
					email,
					password,
					location,
				}),
				{
					maxRetries: 2, // Fewer retries for registration
					delayMs: 800,
					context: "Account registration"
				}
			);

			if (!response.data.success) {
				throw new AppError(response.data.message || "Registration failed", { code: 'REGISTRATION_FAILED' });
			}

			const { accessToken, refreshToken, userId, expiresIn } =
				response.data.data;

			if (!accessToken) {
				throw new AppError("Missing authentication token", { code: 'TOKEN_MISSING' });
			}

			// Store tokens
			await AsyncStorage.setItem("accessToken", accessToken);
			if (refreshToken) {
				await AsyncStorage.setItem("refreshToken", refreshToken);
			}
			await AsyncStorage.setItem("userId", userId);

			// Store token expiration time if provided
			if (expiresIn) {
				const expirationTime = new Date().getTime() + expiresIn * 1000;
				await AsyncStorage.setItem("tokenExpiration", expirationTime.toString());
			}

			// Set auth header for future requests
			api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

			// Set user data
			const user = await getUser(userId);

			if (!user) {
				throw new AppError("User not found", { code: 'USER_NOT_FOUND' });
			}

			setUser(user);

		} catch (error) {
			// Handle common registration errors
			let errorMessage = "Registration failed. Please try again.";

			if (axios.isAxiosError(error)) {
				if (error.response) {
					if (error.response.status === 409) {
						errorMessage = "Email already exists. Please use a different email address.";
					} else if (error.response.data?.message) {
						errorMessage = error.response.data.message;
					} else if (error.response.status >= 500) {
						errorMessage = "Server error. Please try again later.";
					}
				} else if (error.request) {
					errorMessage = "Network error. Please check your connection and try again.";
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			// Log in development, use proper error tracking in production
			if (process.env.NODE_ENV !== 'production') {
				console.error("Registration failed:", error);
			} else {
				// In production, this would use a service like Sentry
				// Example: Sentry.captureException(error);
			}

			// Rethrow for component handling
			throw new Error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	// Logout function
	const logout = async () => {
		if (process.env.NODE_ENV !== 'production') {
			console.log("Logging out user");
		}

		try {
			// Reset refresh attempts and tracking
			refreshAttempts.current = 0;
			refreshInProgress.current = false;
			lastRefreshTime.current = 0;

			// Clear stored data
			await AsyncStorage.removeItem("accessToken");
			await AsyncStorage.removeItem("refreshToken");
			await AsyncStorage.removeItem("userId");
			await AsyncStorage.removeItem("tokenExpiration");

			// Clear auth headers
			delete api.defaults.headers.common["Authorization"];

			// Clear user state
			setUser(null);
		} catch (error) {
			// For logout, even if there's an error, we still want to clear local state
			// so a failed logout doesn't leave the user in a broken authentication state
			setUser(null);

			// Log the error but don't display to user since we're still clearing their session
			if (process.env.NODE_ENV !== 'production') {
				console.error("Logout error:", error);
			} else {
				// In production, this would use a service like Sentry
				// Example: Sentry.captureException(error);
			}
		}
	};

	const reloadUser = async () => {
		setLoading(true);
		try {
			const userId = await AsyncStorage.getItem("userId");
			if (!userId) {
				throw new AppError("User ID not found", { code: 'USER_ID_MISSING' });
			}

			// Use retry operation for API call
			const response = await retryOperation(
				() => api.get(`/api/auth/user/${userId}`),
				{
					maxRetries: 3,
					delayMs: 800,
					context: "User profile refresh"
				}
			);

			if (!response.data.success) {
				throw new AppError("Failed to fetch user data", { code: 'USER_FETCH_FAILED' });
			}

			setUser(response.data.data.user);
		} catch (error) {
			// Handle error with our helper
			handleError(error, "Profile reload");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				register,
				logout,
				isAuthenticated: !!user,
				refreshTokens,
				reloadUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

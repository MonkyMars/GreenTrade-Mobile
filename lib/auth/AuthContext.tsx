import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { User } from "../types/user";
import api from "../backend/api/axiosConfig";
import { getUser } from "lib/backend/auth/user";

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
    const [tokenRefreshing, setTokenRefreshing] = useState(false);

    // Add refs to track refresh state
    const refreshInProgress = useRef(false);
    const refreshAttempts = useRef(0);
    const maxRefreshAttempts = 3;
    const lastRefreshTime = useRef(0);

    // Function to refresh access token
    const refreshTokens = async (): Promise<boolean> => {
        // Prevent concurrent refresh attempts
        if (refreshInProgress.current) {
            console.log("Token refresh already in progress, skipping...");
            return false;
        }

        // Implement rate limiting
        const now = new Date().getTime();
        const timeSinceLastRefresh = now - lastRefreshTime.current;
        if (lastRefreshTime.current > 0 && timeSinceLastRefresh < 5000) { // Increased to 5 seconds
            console.log(`Rate limiting refresh (${timeSinceLastRefresh}ms since last attempt)`);
            return false;
        }
        lastRefreshTime.current = now;

        // Check max attempts
        if (refreshAttempts.current >= maxRefreshAttempts) {
            console.error(`Maximum refresh attempts (${maxRefreshAttempts}) reached. Logging out.`);
            await logout();
            return false;
        }

        refreshAttempts.current += 1;
        refreshInProgress.current = true;

        try {
            setTokenRefreshing(true);
            const refreshToken = await AsyncStorage.getItem("refreshToken");

            if (!refreshToken) {
                throw new Error("No refresh token found");
            }

            console.log("Attempting to refresh token with:", refreshToken.substring(0, 10) + "...");

            // Match the backend's expected format exactly
            const response = await api.post(
                `/auth/refresh`,
                { refreshToken } // This needs to match your backend's expected structure
            );

            // Match your backend response structure
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;

            if (!accessToken || !newRefreshToken) {
                throw new Error("Invalid refresh token response");
            }

            // Store the new tokens
            await AsyncStorage.setItem("accessToken", accessToken);
            await AsyncStorage.setItem("refreshToken", newRefreshToken);

            // Store the expiration time
            const expirationTime = new Date().getTime() + expiresIn * 1000;
            await AsyncStorage.setItem("tokenExpiration", expirationTime.toString());

            // Give a small delay to ensure the token is properly stored
            // before the next request uses it
            await new Promise(resolve => setTimeout(resolve, 50));

            console.log("Token refresh successful");
            // Reset attempt counter on success
            refreshAttempts.current = 0;

            return true;
        } catch (error) {
            console.error("Token refresh failed:", error);

            // Progressive backoff on failures
            await new Promise(resolve =>
                setTimeout(resolve, Math.min(1000 * refreshAttempts.current, 5000))
            );

            // Only clear auth state after max attempts
            if (refreshAttempts.current >= maxRefreshAttempts) {
                console.log("Max refresh attempts reached, logging out");
                await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId", "tokenExpiration"]);
                delete api.defaults.headers.common["Authorization"];
                setUser(null);
            }

            return false;
        } finally {
            setTokenRefreshing(false);
            refreshInProgress.current = false;
        }
    };

    // Fix the axios interceptor to avoid infinite refresh loops
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config;

                // Prevent infinite retry loops - check retry flag and status code
                if (
                    error.response?.status === 401 &&
                    !originalRequest._retry &&
                    refreshAttempts.current < maxRefreshAttempts
                ) {
                    originalRequest._retry = true;

                    try {
                        console.log("401 error detected, attempting token refresh");
                        const refreshSuccess = await refreshTokens();
                        if (refreshSuccess) {
                            // Retry the original request with new token
                            // Get the latest token to ensure we're using the most recent one
                            const token = await AsyncStorage.getItem("accessToken");
                            if (!token) {
                                throw new Error("Failed to get new access token after refresh");
                            }

                            // Use the fresh token for the retried request
                            originalRequest.headers["Authorization"] = `Bearer ${token}`;

                            // Small delay to ensure token is available
                            await new Promise(resolve => setTimeout(resolve, 50));

                            // Return the retried request
                            return api(originalRequest);
                        } else {
                            console.log("Token refresh failed, rejecting original request");
                        }
                    } catch (refreshError) {
                        console.error("Error during token refresh:", refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        // Clean up interceptor on unmount
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

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
                    throw new Error("User ID not found");
                }

                const response = await api.get(`/api/auth/user/${userId}`);

                if (!response.data.success) {
                    throw new Error("Failed to fetch user data");
                }

                setUser(response.data.data.user);
            } catch (error) {
                console.error("Auth validation error:", error);
                // Clear tokens on authentication error
                await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId", "tokenExpiration"]);
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    // Login function
    const login = async (email: string, password: string) => {
        // Don't set global loading state to true here
        // This allows the login component to control its own loading state
        try {
            console.log('Attempting login for:', email);

            const response = await api.post(
                `/auth/login`,
                {
                    email,
                    password,
                }
            );

            // Check if the response has an error message
            if (!response.data.success) {
                throw new Error(response.data.message || "Login failed");
            }

            if (!response.data || !response.data.data) {
                throw new Error("Invalid login response format");
            }

            // Check response format based on your API
            const { accessToken, refreshToken, userId, expiresIn } = response.data.data;

            if (!accessToken) {
                throw new Error("Missing authentication token");
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
                throw new Error("User not found");
            }

            // Update user state - this will trigger navigation due to authentication state change
            setUser(user);

        } catch (error) {
            console.error("Login failed:", error);

            // Clean up any partial auth state
            await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId"]);

            // Handle common errors and expose appropriate messages
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Server responded with an error status code
                    if (error.response.status === 401) {
                        throw new Error("Invalid credentials");
                    } else if (error.response.data && error.response.data.message) {
                        throw new Error(error.response.data.message);
                    }
                } else if (error.request) {
                    // No response received
                    throw new Error("Network error. Please check your connection.");
                }
            }

            // For other kinds of errors, pass them along
            if (error instanceof Error) {
                throw error;
            }

            // Default error
            throw new Error("Login failed. Please try again.");
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
            const response = await api.post(
                `/auth/register`,
                {
                    name,
                    email,
                    password,
                    location,
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.message || "Registration failed");
            }

            const { accessToken, refreshToken, userId, expiresIn } = response.data.data;


            if (!accessToken) {
                throw new Error("Missing authentication token");
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
                throw new Error("User not found");
            }

            setUser(user);

        } catch (error) {
            console.error("Registration failed:", error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.message || "Registration failed");
            }
            throw new Error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        console.log('Logging out user');

        try {
            // Reset refresh attempts and tracking
            refreshAttempts.current = 0;
            refreshInProgress.current = false;
            lastRefreshTime.current = 0;

            // Clear stored data
            await AsyncStorage.multiRemove([
                "accessToken",
                "refreshToken",
                "userId",
                "tokenExpiration"
            ]);

            // Clear auth headers
            delete api.defaults.headers.common["Authorization"];

            // Clear user state
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const reloadUser = async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found");
            }

            const response = await api.get(`/api/auth/user/${userId}`);

            if (!response.data.success) {
                throw new Error("Failed to fetch user data");
            }

            setUser(response.data.data.user);
        } catch (error) {
            console.error("Reload error:", error);
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
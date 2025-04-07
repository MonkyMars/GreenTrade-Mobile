import React, { createContext, useContext, useState, useEffect } from "react";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [tokenRefreshing, setTokenRefreshing] = useState(false);

    // Function to refresh access token
    const refreshTokens = async (): Promise<boolean> => {
        try {
            setTokenRefreshing(true);
            const refreshToken = await AsyncStorage.getItem("refreshToken");

            if (!refreshToken) {
                throw new Error("No refresh token found");
            }

            // Call refresh endpoint with the refresh token
            const response = await api.post(
                `/auth/refresh`,
                {
                    body: {
                        refreshToken,
                    }
                }
            );

            if (!response.data || !response.data.accessToken) {
                throw new Error("Invalid refresh token response");
            }

            // Update tokens in storage
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

            await AsyncStorage.setItem("accessToken", accessToken);
            await AsyncStorage.setItem("refreshToken", newRefreshToken);

            // Store the expiration time
            const expirationTime = new Date().getTime() + expiresIn * 1000;
            await AsyncStorage.setItem("tokenExpiration", expirationTime.toString());

            // Update authorization header
            api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

            return true;
        } catch (error) {
            console.error("Token refresh failed:", error);

            // Clear auth state on refresh failure
            await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId", "tokenExpiration"]);
            delete api.defaults.headers.common["Authorization"];
            setUser(null);

            return false;
        } finally {
            setTokenRefreshing(false);
        }
    };

    // Set up axios interceptor for token refresh
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config;

                // If error is 401 and we haven't tried refreshing token yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshSuccess = await refreshTokens();
                        if (refreshSuccess) {
                            // Retry the original request with new token
                            const token = await AsyncStorage.getItem("accessToken");
                            originalRequest.headers["Authorization"] = `Bearer ${token}`;
                            return api(originalRequest);
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
        try {
            setLoading(true);
            console.log('Attempting login for:', email);

            const response = await api.post(
                `/auth/login`,
                {
                    email,
                    password,
                }
            );

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

            setUser(user);

            // Note: Navigation will be handled in the component that calls this function

        } catch (error) {
            console.error("Login failed:", error);

            // Clean up any partial auth state
            await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId"]);

            // Handle error based on structure from your API
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401) {
                    throw new Error("Invalid credentials");
                }
                throw new Error(error.response.data.message || "Login failed");
            }

            throw new Error("Network error. Please try again.");
        } finally {
            setLoading(false);
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
            await api.post(
                `/auth/register`,
                {
                    name,
                    email,
                    password,
                    location,
                }
            );

            // After registration, log the user in
            await login(email, password);
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
            // Clear stored data
            await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId", "tokenExpiration"]);

            // Clear auth headers
            delete api.defaults.headers.common["Authorization"];

            // Clear user state
            setUser(null);

            // Note: Navigation will be handled in the component that calls this function
        } catch (error) {
            console.error("Logout error:", error);
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
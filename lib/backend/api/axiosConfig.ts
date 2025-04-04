// lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add the auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error),
)

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) {
          // No refresh token available, redirect to login
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // Try to get a new token
        const response = await axios.post(
          'http://localhost:8081/auth/refresh',
          {
            refreshToken,
          },
        )

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data

        // Store the new tokens
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Retry the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        return axios(originalRequest)
      } catch (refreshError) {
        // If refresh token is invalid, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api

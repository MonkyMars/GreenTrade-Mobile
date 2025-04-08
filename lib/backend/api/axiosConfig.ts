import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

const BASE_URL = 'http://192.168.178.10:8080'

axios.interceptors.request.use(config => {
  const token = AsyncStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export default api

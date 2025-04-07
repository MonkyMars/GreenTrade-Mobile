import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/axiosConfig'

export const getUser = async (uuid: string) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (!token) {
    throw new Error('No access token found')
  }
  api.defaults.headers['Authorization'] = `Bearer ${token}`
  const response = await api.get(`/api/auth/user/${uuid}`)
  console.log('User response:', response.data)
  const user = response.data.data.user
  return user
}

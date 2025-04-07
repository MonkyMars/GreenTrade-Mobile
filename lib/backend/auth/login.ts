import api from '../api/axiosConfig'

interface LoginUser {
  email: string
  password: string
}

export const Login = async (user: LoginUser) => {
  const response = await api.post(`/auth/login`, {
    email: user.email,
    password: user.password,
  })
  return response.data.data || response.data
}

import api from '../api/axiosConfig'

interface RegisterUser {
  email: string
  password: string
  name: string
  passwordConfirm?: string
  acceptTerms?: boolean
  location?: string
}

export const Register = async (user: RegisterUser) => {
  if (user.passwordConfirm && user.password !== user.passwordConfirm) {
    throw new Error('Passwords do not match')
  }

  const response = await api.post(`/auth/register`, {
    email: user.email,
    password: user.password,
    name: user.name,
    location: user.location,
  })
  return response.data.data || response.data
}

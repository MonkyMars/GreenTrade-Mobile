import api from 'lib/backend/api/axiosConfig'

export const getSellerBio = async (
  uuid: string,
  isAuthenticated: boolean = true,
): Promise<boolean | string> => {
  if (!isAuthenticated) {
    return false
  }
  try {
    const response = await api.get(`/api/sellers/bio/${uuid}`)
    console.log(response.data)
    if (!response.data.success) {
      throw new Error('Seller not found')
    }
    return response.data.data.bio
  } catch (error) {
    console.error('Error fetching seller:', error)
    throw error
  }
}

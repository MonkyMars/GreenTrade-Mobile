import api from 'lib/backend/api/axiosConfig'

export const getSeller = async (sellerId: string) => {
  try {
    const response = await api.get(`/seller/${sellerId}`)

    if (!response.data || !response.data.success) {
      throw new Error(
        'Failed to fetch seller: Server returned unsuccessful response',
      )
    }
    console.log('Seller data:', response.data.data)
    return response.data.data
  } catch (error) {
    console.error('Get seller error:', error)
    throw error
  }
}

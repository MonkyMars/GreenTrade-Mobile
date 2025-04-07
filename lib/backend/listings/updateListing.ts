import api from '../api/axiosConfig'

export const updateListing = async (listingId: number, updates: unknown) => {
  try {
    const response = await api.patch(`/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.data.success) throw new Error('Failed to update listing')

    return await response.data.data
  } catch (error) {
    console.error(error)
  }
}

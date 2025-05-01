import api from '../api/axiosConfig'

/*
state = true -> already favorited, remove from favorites
state = false -> not favorited, add to favorites
*/
export const toggleFavorite = async (
  userId: string,
  listingId: string,
  state: boolean,
) => {
  try {
    const response = state
      ? await api.delete(`/api/favorites/${listingId}/${userId}`)
      : await api.post(`/api/favorites`, {
          listing_id: listingId,
          user_id: userId,
        })

    if (!response.data.success) {
      throw new Error('Failed to toggle favorite')
    }

    const isFavorited = !state

    return isFavorited
  } catch (error) {
    console.error('Error toggling favorite:', error)
    throw error
  }
}

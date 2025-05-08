import FontAwesome from 'react-native-vector-icons/FontAwesome'

export const categories: {
  id: string
  icon: (typeof FontAwesome)['name']
  name: string
}[] = [
  { id: 'all', icon: 'folder', name: 'All Categories' },
  { id: 'home-garden', icon: 'home', name: 'Home & Garden' },
  { id: 'fashion', icon: 'shopping-bag', name: 'Fashion' },
  { id: 'electronics', icon: 'laptop', name: 'Electronics' },
  { id: 'vehicles', icon: 'car', name: 'Vehicles' },
  { id: 'books', icon: 'book', name: 'Books' },
  { id: 'jewerly', icon: 'diamond', name: 'Jewerly' },
  { id: 'toys-games', icon: 'gamepad', name: 'Toys & Games' },
  { id: 'other', icon: 'question', name: 'Other' },
]

export const findCategory = (id: string) => {
  return (
    categories.find(
      category =>
        category.id ===
        id.toLocaleLowerCase().replace('&', '-').replaceAll(' ', ''),
    ) || categories[0]
  )
}

export const cleanCategory = (category: string) => {
  return category
    .toLocaleLowerCase()
    .replace('&', '-')
    .replaceAll(' ', '')
    .replaceAll('!', '')
}

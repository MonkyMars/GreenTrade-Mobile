export const categories: {
  id: string
  icon: string
  name: string
}[] = [
  { id: 'all', icon: 'folder', name: 'All Categories' },
  { id: 'home-garden', icon: 'home', name: 'Home & Garden' },
  { id: 'fashion', icon: 'shirt', name: 'Fashion' },
  { id: 'electronics', icon: 'laptop', name: 'Electronics' },
  { id: 'vehicles', icon: 'car', name: 'Vehicles' },
  { id: 'books', icon: 'books', name: 'Books' },
  { id: 'jewerly', icon: 'diamond', name: 'Jewerly' },
  { id: 'toys-games', icon: 'gamepad', name: 'Toys & Games' },
  { id: 'other', icon: 'question_mark', name: 'Other' },
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

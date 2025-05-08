import {
  FontAwesome,
  MaterialIcons,
  MaterialCommunityIcons,
  Octicons,
} from '@expo/vector-icons'

export interface Condition {
  name:
    | 'New'
    | 'Like New'
    | 'Very Good'
    | 'Good'
    | 'Acceptable'
    | 'For Parts/Not Working'
  icon: {
    library:
      | typeof FontAwesome
      | typeof MaterialIcons
      | typeof MaterialCommunityIcons
      | typeof Octicons
    name: string
  }
}

// All icons come from supported @expo/vector-icons libraries
export const conditions: Condition[] = [
  {
    name: 'New',
    icon: {
      library: FontAwesome,
      name: 'box',
    },
  },
  {
    name: 'Like New',
    icon: {
      library: MaterialIcons,
      name: 'check-circle-outline',
    },
  },
  {
    name: 'Very Good',
    icon: {
      library: FontAwesome,
      name: 'star',
    },
  },
  {
    name: 'Good',
    icon: {
      library: FontAwesome,
      name: 'thumbs-up',
    },
  },
  {
    name: 'Acceptable',
    icon: {
      library: Octicons,
      name: 'circle',
    },
  },
  {
    name: 'For Parts/Not Working',
    icon: {
      library: MaterialIcons,
      name: 'build',
    },
  },
]

export const findCondition = (name: Condition['name']) => {
  return conditions.find(condition => condition.name === name) || conditions[0]
}

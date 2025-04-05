import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../app/navigation'
import { useTheme } from '../lib/theme/ThemeContext'

type BottomNavigationProps = {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function BottomNavigation({
  activeTab = 'home',
  onTabChange,
}: BottomNavigationProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { colors } = useTheme()

  const handleTabPress = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    }

    // Navigation logic based on tab
    switch (tab) {
      case 'home':
        navigation.navigate('Home')
        break
      case 'profile':
        navigation.navigate('Login')
        break
      case 'listings':
        navigation.navigate('Listings')
        break
      case 'post':
        navigation.navigate('Post')
        break
      default:
        navigation.navigate('Home')
        break
    }
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
      }}
    >
      <TouchableOpacity
        style={{
          alignItems: 'center',
          padding: 8,
          borderTopWidth: activeTab === 'home' ? 2 : 0,
          borderTopColor: activeTab === 'home' ? colors.primary : 'transparent',
        }}
        onPress={() => handleTabPress('home')}
      >
        <FontAwesome
          name="home"
          size={20}
          color={activeTab === 'home' ? colors.primary : colors.textTertiary}
        />
        <Text
          style={{
            fontSize: 12,
            color: activeTab === 'home' ? colors.primary : colors.textTertiary,
            marginTop: 4,
          }}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          alignItems: 'center',
          padding: 8,
          borderTopWidth: activeTab === 'listings' ? 2 : 0,
          borderTopColor:
            activeTab === 'listings' ? colors.primary : 'transparent',
        }}
        onPress={() => handleTabPress('listings')}
      >
        <FontAwesome
          name="list-alt"
          size={20}
          color={
            activeTab === 'listings' ? colors.primary : colors.textTertiary
          }
        />
        <Text
          style={{
            fontSize: 12,
            color:
              activeTab === 'listings' ? colors.primary : colors.textTertiary,
            marginTop: 4,
          }}
        >
          Browse
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          alignItems: 'center',
          padding: 8,
          borderTopWidth: activeTab === 'post' ? 2 : 0,
          borderTopColor: activeTab === 'post' ? colors.primary : 'transparent',
        }}
        onPress={() => handleTabPress('post')}
      >
        <FontAwesome
          name="plus-circle"
          size={20}
          color={activeTab === 'post' ? colors.primary : colors.textTertiary}
        />
        <Text
          style={{
            fontSize: 12,
            color: activeTab === 'post' ? colors.primary : colors.textTertiary,
            marginTop: 4,
          }}
        >
          Post
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          alignItems: 'center',
          padding: 8,
          borderTopWidth: activeTab === 'profile' ? 2 : 0,
          borderTopColor:
            activeTab === 'profile' ? colors.primary : 'transparent',
        }}
        onPress={() => handleTabPress('profile')}
      >
        <FontAwesome
          name="user"
          size={20}
          color={activeTab === 'profile' ? colors.primary : colors.textTertiary}
        />
        <Text
          style={{
            fontSize: 12,
            color:
              activeTab === 'profile' ? colors.primary : colors.textTertiary,
            marginTop: 4,
          }}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = {
  bottomNav:
    'flex-row justify-around pt-2 pb-1 bg-white border-t border-gray-200',
  navButton: 'items-center p-2',
  activeNavButton: 'border-t-2 border-green-600',
  navText: 'text-xs text-gray-500 mt-1',
  activeNavText: 'text-xs text-green-600 mt-1',
}

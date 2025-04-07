import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../app/navigation'
import { useTheme } from '../lib/theme/ThemeContext'
import { useAuth } from 'lib/auth/AuthContext'

type BottomNavigationProps = {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function BottomNavigation({
  activeTab = 'home',
  onTabChange,
}: BottomNavigationProps) {
  const { isAuthenticated } = useAuth()
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
      case 'account':
        navigation.navigate('Account')
        break
      case 'login':
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
          borderTopWidth: activeTab === 'account' || 'login' ? 2 : 0,
          borderTopColor:
            activeTab === 'account' || activeTab === 'login' ? colors.primary : 'transparent',
        }}
        onPress={() => handleTabPress(isAuthenticated ? 'account' : 'login')}
      >
        <FontAwesome
          name="user"
          size={20}
          color={activeTab === 'account' || activeTab === 'login' ? colors.primary : colors.textTertiary}
        />
        <Text
          style={{
            fontSize: 12,
            color:
              activeTab === 'account' || activeTab === 'login' ? colors.primary : colors.textTertiary,
            marginTop: 4,
          }}
        >
          {isAuthenticated ? 'Account' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

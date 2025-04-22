import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NativeStackNavigationProp } from '@react-navigation/native-stack/lib/typescript/src/types'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import HomeScreen from './home'
import LoginScreen from './login'
import ListingsScreen from './listings'
import ListingDetailScreen from './listing/[id]';
import PostScreen from './post'
import AccountScreen from './account'
import { useAuth } from 'lib/auth/AuthContext'
import RegisterScreen from './register'
import MessagesScreen from './messages'
import SellerScreen from './seller/[id]'
import { useTheme } from 'lib/theme/ThemeContext'
import ReviewsScreen from './reviews'

// Define the types for our navigation routes
export type RootStackParamList = {
  Account: undefined
  Login: undefined
  Register: undefined
  Home: undefined
  Navigation: undefined
  Post: undefined
  Messages: undefined
  Listings: { category?: string }
  ListingDetail: { id: number }
  SellerDetail: { id: string }
}

// Create the stack navigator without generic type parameter
const Stack = createNativeStackNavigator()

export function Navigation() {
  const { isAuthenticated, loading } = useAuth()
  const { colors } = useTheme()

  // Display a loading indicator while auth state is being determined
  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'Home' : 'Login'}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 200,
            // Disable all gesture navigation by default
            gestureEnabled: false,
            // Prevent Android back button from unexpected navigation
            freezeOnBlur: true,
            // Make sure transitions don't result in white screens
            contentStyle: { backgroundColor: colors.background }
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />

          {/* Only enable gestures for detail screens with proper configuration */}
          <Stack.Screen
            name="Listings"
            component={ListingsScreen}
          />
          <Stack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'slide_from_right',
              animationDuration: 300
            }}
          />
          <Stack.Screen name="Post" component={PostScreen} />
          <Stack.Screen name="Account" component={AccountScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen
            name="SellerDetail"
            component={SellerScreen}
            options={{
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'slide_from_right',
              animationDuration: 300
            }}
          />
          <Stack.Screen name="Reviews" component={ReviewsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}

// Export type for using navigation in components
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>
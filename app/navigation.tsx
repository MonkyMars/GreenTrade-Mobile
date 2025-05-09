import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NativeStackNavigationProp } from '@react-navigation/native-stack/lib/typescript/src/types'
import HomeScreen from './home'
import LoginScreen from './login'
import ListingsScreen from './listings'
import ListingDetailScreen from './listing/[id]';
import PostScreen from './post'
import AccountScreen from './account'
import { useAuth } from 'lib/contexts/AuthContext'
import RegisterScreen from './register'
import MessagesScreen from './messages'
import SellerScreen from './seller/[id]'
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
	Reviews: undefined
	SellerDetail: { id: string }
	Listings: { category?: string }
	ListingDetail: { id: string }
}

// Create the stack navigator without generic type parameter
const Stack = createNativeStackNavigator()

export function Navigation() {
	const { isAuthenticated, loading } = useAuth()

	if (loading) {
		return null
	}

	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName={isAuthenticated ? 'Home' : 'Login'}
				screenOptions={{ headerShown: false }}
			>
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="Listings" component={ListingsScreen} />
				<Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
				<Stack.Screen name="Post" component={PostScreen} />
				<Stack.Screen name="Account" component={AccountScreen} />
				<Stack.Screen name="Register" component={RegisterScreen} />
				<Stack.Screen name="Messages" component={MessagesScreen} />
				<Stack.Screen name="SellerDetail" component={SellerScreen} />
				<Stack.Screen name="Reviews" component={ReviewsScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	)
}

// Export type for using navigation in components
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useState, useEffect } from 'react'
import HomeScreen from './home'
import LoginScreen from './login'
import ListingsScreen from './listings'
import PostScreen from './post'
import AccountScreen from './account'
import { useAuth } from 'lib/auth/AuthContext'

// Define the types for our navigation routes
export type RootStackParamList = {
  Account: undefined
  Login: undefined
  Home: undefined
  Navigation: undefined
  Post: undefined
  Listings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

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
        <Stack.Screen name="Post" component={PostScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

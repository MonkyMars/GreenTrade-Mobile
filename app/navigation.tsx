import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';

import HomeScreen from './home';
import LoginScreen from './login';

// Define the types for our navigation routes
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  // Add more screen routes here as needed
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Simple hook to simulate auth state checking
// In a real app, this would check AsyncStorage, SecureStore, or a context
const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking authentication status
    const checkAuth = async () => {
      try {
        // In a real app, you would check for stored credentials, tokens, etc.
        // For testing the home screen, we'll set this to true
        const loggedIn = true;
        setIsAuthenticated(loggedIn);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading };
};

export function Navigation() {
  const { isAuthenticated, isLoading } = useAuthState();

  if (isLoading) {
    // You could return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* Add more screens here as they are created */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

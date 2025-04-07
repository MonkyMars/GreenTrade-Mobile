import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from './lib/theme/ThemeContext'
import { Navigation } from './app/navigation'
import './global.css'
import { AuthProvider } from 'lib/auth/AuthContext'

// Wrapper component to access theme context for StatusBar
const Main = () => {
  const { isDark } = useTheme()

  return (
    <SafeAreaProvider>
      <Navigation />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Main />
      </AuthProvider>
    </ThemeProvider>
  )
}

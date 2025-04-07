import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

import { type RootStackParamList } from './navigation'
import BottomNavigation from 'components/BottomNavigation'
import { useTheme } from '../lib/theme/ThemeContext'
import { useAuth } from '../lib/auth/AuthContext'

// Define props type for the login screen using React Navigation
type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>

// Ensure authentication redirect is handled properly
WebBrowser.maybeCompleteAuthSession()

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState('home')
  const { login } = useAuth()
  const { colors, isDark } = useTheme()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleChange = (name: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = () => {
    try {
      loginSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof LoginFormData, string>> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof LoginFormData] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async () => {
    setLoginError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      // Navigate to Home screen after successful login
      navigation.navigate('Home')
    } catch (error) {
      console.error('Login error:', error)

      // Handle the error from the API
      if (typeof error === 'string') {
        setLoginError(error)
      } else if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          setLoginError(error.message)
        } else {
          setLoginError('Invalid email or password. Please try again.')
        }
      } else {
        setLoginError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true)
      // In a real app, this would connect to your OAuth provider
      // For now, we'll just show an alert
      Alert.alert('Social Login', `Logging in with ${provider}`)
    } catch (error) {
      console.error(`${provider} login error:`, error)
      setLoginError(`Failed to login with ${provider}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              justifyContent: 'center',
            }}
          >
            <View style={{ marginBottom: 24, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="leaf" size={40} color={colors.primary} />
                <Text style={{ marginLeft: 8, fontSize: 30, fontWeight: 'bold', color: colors.primary }}>GreenTrade</Text>
              </View>
              <Text style={{ marginTop: 24, fontSize: 24, fontWeight: 'bold', color: colors.text }}>
                Sign in to your account
              </Text>
              <TouchableOpacity>
                <Text style={{ marginTop: 8, fontSize: 14, color: colors.primary }}>
                  Or create a new account
                </Text>
              </TouchableOpacity>
            </View>

            {loginError ? (
              <View style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.error,
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 0.8)'
              }}>
                <Text style={{ color: colors.error }}>
                  {loginError === 'Invalid credentials'
                    ? 'Invalid email or password. Please try again.'
                    : loginError}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: 16 }}>
              <View>
                <View style={{ position: 'relative' }}>
                  <View style={{ position: 'absolute', left: 12, top: 22, zIndex: 10 }}>
                    <FontAwesome name="envelope" size={16} color={colors.textTertiary} />
                  </View>
                  <TextInput
                    placeholder="Email address"
                    value={formData.email}
                    onChangeText={value => handleChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textTertiary}
                    style={{
                      height: 48,
                      borderRadius: 6,
                      backgroundColor: colors.card,
                      color: colors.text,
                      paddingVertical: 8,
                      paddingLeft: 40,
                      paddingRight: 12,
                      marginVertical: 8,
                      borderWidth: 1,
                      borderColor: errors.email ? colors.error : colors.border
                    }}
                  />
                </View>
                {errors.email ? (
                  <Text style={{ marginTop: 4, fontSize: 14, color: colors.error }}>{errors.email}</Text>
                ) : null}
              </View>
              <View>
                <View style={{ position: 'relative' }}>
                  <View style={{ position: 'absolute', left: 12, top: 22, zIndex: 10 }}>
                    <FontAwesome name='lock' size={16} color={colors.textTertiary} />
                  </View>
                  <TextInput
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={value => handleChange('password', value)}
                    secureTextEntry
                    placeholderTextColor={colors.textTertiary}
                    style={{
                      height: 48,
                      borderRadius: 6,
                      backgroundColor: colors.card,
                      color: colors.text,
                      paddingVertical: 8,
                      paddingLeft: 40,
                      paddingRight: 12,
                      marginVertical: 8,
                      borderWidth: 1,
                      borderColor: errors.password ? colors.error : colors.border
                    }}
                  />
                </View>
                {errors.password ? (
                  <Text style={{ marginTop: 4, fontSize: 14, color: colors.error }}>{errors.password}</Text>
                ) : null}
              </View>

              <TouchableOpacity>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.primary }}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                  height: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                ) : null}
                <Text style={{ fontWeight: '500', color: 'white' }}>Sign in</Text>
              </TouchableOpacity>

              <View style={{ position: 'relative', paddingVertical: 16 }}>
                <View style={{ position: 'absolute', inset: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ flex: 1, borderTopWidth: 1, borderColor: colors.border }} />
                </View>
                <View style={{ position: 'relative', flexDirection: 'row', justifyContent: 'center' }}>
                  <View style={{ backgroundColor: colors.background, paddingHorizontal: 16 }}>
                    <Text style={{ fontSize: 14, color: colors.textTertiary }}>Or continue with</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleSocialLogin('google')}
                style={{
                  height: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border
                }}
              >
                <FontAwesome name='google' size={16} color={colors.text} />
                <Text style={{ marginLeft: 8, color: colors.text }}>Google</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}

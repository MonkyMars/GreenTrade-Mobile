import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { FaEnvelope, FaGoogle, FaLeaf, FaLock } from 'react-icons/fa'
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

// Mock authentication context (will be replaced with actual implementation)
const useAuth = () => {
  const login = async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For demo purposes, accept any login with valid format
    if (email && password.length >= 8) {
      return true
    }
    throw new Error('Invalid credentials')
  }

  return { login }
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState('home')
  const { login } = useAuth()
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
      Alert.alert('Success', 'You have successfully logged in!')
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
      <SafeAreaView className={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className={styles.keyboardView}
        >
          <ScrollView
            className={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View className={styles.header}>
              <View className={styles.logoContainer}>
                <FaLeaf size={40} color="#16a34a" />
                <Text className={styles.logoText}>GreenTrade</Text>
              </View>
              <Text className={styles.title}>Sign in to your account</Text>
              <TouchableOpacity>
                <Text className={styles.createAccount}>
                  Or create a new account
                </Text>
              </TouchableOpacity>
            </View>

            {loginError ? (
              <View className={styles.errorContainer}>
                <Text className={styles.errorText}>
                  {loginError === 'Invalid credentials'
                    ? 'Invalid email or password. Please try again.'
                    : loginError}
                </Text>
              </View>
            ) : null}

            <View className={styles.formContainer}>
              <View>
                <View className={styles.inputWrapper}>
                  <View className={styles.inputIcon}>
                    <FaEnvelope size={16} color="#9ca3af" />
                  </View>
                  <TextInput
                    placeholder="Email address"
                    value={formData.email}
                    onChangeText={value => handleChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className={`${styles.textInput} ${errors.email ? styles.inputError : styles.inputBorder
                      }`}
                  />
                </View>
                {errors.email ? (
                  <Text className={styles.fieldError}>{errors.email}</Text>
                ) : null}
              </View>
              <View>
                <View className={styles.inputWrapper}>
                  <View className={styles.inputIcon}>
                    <FaLock size={16} color="#9ca3af" />
                  </View>
                  <TextInput
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={value => handleChange('password', value)}
                    secureTextEntry
                    className={`${styles.textInput} ${errors.password ? styles.inputError : styles.inputBorder
                      }`}
                  />
                </View>
                {errors.password ? (
                  <Text className={styles.fieldError}>{errors.password}</Text>
                ) : null}
              </View>

              <TouchableOpacity>
                <Text className={styles.forgotPassword}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className={`${styles.submitButton} 
              ${isLoading ? styles.buttonDisabled : ''}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" className={styles.spinner} />
                ) : null}
                <Text className={styles.submitButtonText}>Sign in</Text>
              </TouchableOpacity>

              <View className={styles.dividerContainer}>
                <View className={styles.dividerLine}>
                  <View className={styles.divider} />
                </View>
                <View className={styles.dividerTextContainer}>
                  <View className={styles.dividerBackground}>
                    <Text className={styles.dividerText}>Or continue with</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleSocialLogin('google')}
                className={styles.socialButton}
              >
                <FaGoogle size={16} color="#000000" />
                <Text className={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}

const styles = {
  safeArea: 'flex-1 bg-gray-100',
  keyboardView: 'flex-1',
  scrollContent: 'flex-grow justify-center px-6 py-8',
  header: 'mb-6 items-center',
  logoContainer: 'flex-row items-center',
  logoText: 'ml-2 text-3xl font-bold text-green-600',
  title: 'mt-6 text-2xl font-bold text-gray-900',
  createAccount: 'mt-2 text-sm text-green-600',
  errorContainer: 'mb-4 rounded-md border border-red-400 bg-red-100 p-3',
  errorText: 'text-red-700',
  formContainer: 'space-y-4',
  inputWrapper: 'relative',
  inputIcon: 'absolute left-3 top-3',
  textInput: 'h-12 rounded-md bg-white text-gray-900 py-2 pl-10 pr-3',
  inputBorder: 'border border-gray-300',
  inputError: 'border border-red-300',
  fieldError: 'mt-1 text-sm text-red-600',
  forgotPassword: 'text-sm font-medium text-green-600',
  submitButton:
    'h-12 flex-row items-center justify-center rounded-md bg-green-600',
  buttonDisabled: 'opacity-50',
  spinner: 'mr-2',
  submitButtonText: 'font-medium text-white',
  dividerContainer: 'relative py-4',
  dividerLine: 'absolute inset-0 flex items-center justify-center',
  divider: 'w-full border-t border-gray-300',
  dividerTextContainer: 'relative flex justify-center',
  dividerBackground: 'bg-gray-100 px-4',
  dividerText: 'text-sm text-gray-500',
  socialButton:
    'h-12 flex-row items-center justify-center rounded-md border border-gray-300 bg-white',
  socialButtonText: 'ml-2 text-gray-700',
}

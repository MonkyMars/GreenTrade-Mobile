import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
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
    Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { type RootStackParamList } from './navigation'
import BottomNavigation, { Tab } from 'components/BottomNavigation'
import { useTheme } from '../lib/theme/ThemeContext'
import { useAuth } from '../lib/auth/AuthContext'
import { NativeStackNavigationProp } from '@react-navigation/native-stack/lib/typescript/src/types'
import { CountryData, fetchCountriesInEurope } from 'lib/functions/countries'
import Feather from 'react-native-vector-icons/Feather'

// Define props type for the login screen using React Navigation
type RegisterScreenProps = NativeStackNavigationProp<RootStackParamList, 'Login'>

// Ensure authentication redirect is handled properly
WebBrowser.maybeCompleteAuthSession()

const registerSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number')
        .regex(/[\W_]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
    location: z.object({
        country: z.string().min(1, 'Country is required').trim(),
        city: z.string()
            .trim()
            .min(1, 'City is required')
            .regex(/^[\p{L}\s.'-]+$/u, 'City must contain only letters and spaces')
            .transform(str =>
                str.trim()
                    .replace(/\s+/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
            ),
    }),
}).strict().refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
    const [countries, setCountries] = useState<CountryData[]>([])
    const [open, setOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<Tab["name"]>('register')
    const { register } = useAuth()
    const { colors, isDark } = useTheme()
    const [formData, setFormData] = useState<RegisterFormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: {
            country: '',
            city: '',
        },
    })
    const [errors, setErrors] = useState<
        Partial<Record<keyof RegisterFormData, string>>
    >({})
    const [isLoading, setIsLoading] = useState(false)
    const [loginError, setLoginError] = useState('')

    const handleChange = (name: string, value: string | boolean) => {
        setFormData(prev => {
            const updated = { ...prev };

            // Handle nested keys like "location.city"
            const keys = name.split('.');
            let current: any = updated;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key]) current[key] = {}; // create nested object if it doesn't exist
                current = current[key];
            }

            current[keys[keys.length - 1]] = value;

            return updated;
        });

        // Clear corresponding error if exists
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof errors];
                return newErrors;
            });
        }
    };


    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const countries = await fetchCountriesInEurope()
                setCountries(countries)
            } catch (error) {
                console.error('Error fetching countries:', error)
            }
        }

        fetchCountries()
    }, [])

    const validateForm = () => {
        try {
            registerSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof RegisterFormData, string>> = {}
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof RegisterFormData] = err.message
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
            const formattedLocation = `${formData.location.city.trim()}, ${formData.location.country.trim()}`
            await register(
                formData.name,
                formData.email,
                formData.password,
                formattedLocation,
            )
            // Navigate to Home screen after successful login
            navigation.navigate('Home')
        } catch (error) {
            console.error('Register error:', error)

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
                        showsVerticalScrollIndicator={false}
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
                                Create an account
                            </Text>
                            <TouchableOpacity>
                                <Text onPress={() => navigation.navigate('Login')} style={{ marginTop: 8, fontSize: 14, color: colors.primary }}>
                                    Already have an account? Sign in
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

                        <View style={{ gap: 4 }}>
                            <View>
                                <View style={{ position: 'relative' }}>
                                    <View style={{ position: 'absolute', left: 12, top: 22, zIndex: 10 }}>
                                        <FontAwesome name="user" size={16} color={colors.textTertiary} />
                                    </View>
                                    <TextInput
                                        placeholder="Name"
                                        value={formData.name}
                                        onChangeText={value => handleChange('name', value)}
                                        autoComplete='name'
                                        autoCorrect
                                        autoCapitalize="words"
                                        placeholderTextColor={colors.textTertiary}
                                        style={{
                                            height: 48,
                                            borderRadius: 6,
                                            backgroundColor: colors.card,
                                            color: colors.text,
                                            paddingVertical: 8,
                                            paddingLeft: 40,
                                            paddingRight: 12,
                                            marginBottom: 2,
                                            marginTop: 8,
                                            borderWidth: 1,
                                            borderColor: errors.email ? colors.error : colors.border
                                        }}
                                    />
                                </View>
                                {errors.name ? (
                                    <Text style={{ fontSize: 14, color: colors.error }}>{errors.name}</Text>
                                ) : null}
                            </View>
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
                                            marginBottom: 2,
                                            marginTop: 8,
                                            borderWidth: 1,
                                            borderColor: errors.email ? colors.error : colors.border
                                        }}
                                    />
                                </View>
                                {errors.email ? (
                                    <Text style={{ fontSize: 14, color: colors.error }}>{errors.email}</Text>
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
                                            marginBottom: 2,
                                            marginTop: 8,
                                            borderWidth: 1,
                                            borderColor: errors.password ? colors.error : colors.border
                                        }}
                                    />
                                </View>
                                {errors.password ? (
                                    <Text style={{ fontSize: 14, color: colors.error }}>{errors.password}</Text>
                                ) : null}
                            </View>

                            <View>
                                <View style={{ position: 'relative' }}>
                                    <View style={{ position: 'absolute', left: 12, top: 22, zIndex: 10 }}>
                                        <FontAwesome name='lock' size={16} color={colors.textTertiary} />
                                    </View>
                                    <TextInput
                                        placeholder="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChangeText={value => handleChange('confirmPassword', value)}
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
                                            marginBottom: 16,
                                            marginTop: 8,
                                            borderWidth: 1,
                                            borderColor: errors.confirmPassword ? colors.error : colors.border
                                        }}
                                    />
                                </View>
                                {errors.confirmPassword ? (
                                    <Text style={{ fontSize: 14, color: colors.error }}>{errors.password}</Text>
                                ) : null}
                            </View>

                            <View>
                                <View style={{ position: 'relative' }}>
                                    <View style={{ position: 'absolute', left: 12, top: 16, zIndex: 10 }}>
                                        <FontAwesome name='flag' size={16} color={colors.textTertiary} />
                                    </View>
                                    <TouchableOpacity
                                        style={{
                                            borderWidth: 1,
                                            borderColor: errors.location
                                                ? colors.error
                                                : colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 12,
                                            marginBottom: 4,
                                            backgroundColor: colors.card,
                                            flexDirection: 'row',
                                            paddingLeft: 40,
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => setOpen(true)}
                                    >
                                        <Text
                                            style={{
                                                color: formData.location.country
                                                    ? colors.text
                                                    : colors.textTertiary,
                                            }}
                                        >
                                            {formData.location.country || 'Select Country'}
                                        </Text>
                                        <FontAwesome
                                            name="chevron-down"
                                            size={14}
                                            color={colors.textTertiary}
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.location ? (
                                    <Text style={{ marginTop: 4, fontSize: 14, color: colors.error }}>{errors.location}</Text>
                                ) : null}
                            </View>

                            <View style={{ position: 'relative' }}>
                                <View style={{ position: 'absolute', left: 12, top: 22, zIndex: 10 }}>
                                    <FontAwesome name='map-marker' size={16} color={colors.textTertiary} />
                                </View>
                                <TextInput
                                    placeholder="City"
                                    value={formData.location.city}
                                    onChangeText={value => handleChange('location.city', value)}
                                    placeholderTextColor={colors.textTertiary}
                                    style={{
                                        height: 48,
                                        borderRadius: 6,
                                        backgroundColor: colors.card,
                                        color: colors.text,
                                        paddingVertical: 8,
                                        paddingLeft: 40,
                                        paddingRight: 12,
                                        marginBottom: 18,
                                        marginTop: 8,
                                        borderWidth: 1,
                                        borderColor: errors.location ? colors.error : colors.border
                                    }}
                                />
                            </View>
                            {errors.location ? (
                                <Text style={{ marginBottom: 16, fontSize: 14, color: colors.error }}>{errors.location}</Text>
                            ) : null}

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
                                <Text style={{ fontWeight: '500', color: 'white' }}>Sign up</Text>
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
                                    borderColor: colors.border,
                                    marginBottom: 64,
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


            <Modal
                animationType="slide"
                transparent={true}
                visible={open}
                onRequestClose={() => setOpen(false)}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'flex-end',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: colors.card,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            padding: 16,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: '600',
                                    color: colors.text,
                                }}
                            >
                                Select Country
                            </Text>
                            <TouchableOpacity
                                onPress={() => setOpen(false)}
                            >
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {countries.map(country => (
                                <TouchableOpacity
                                    key={country.name}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        borderTopWidth: 1,
                                        borderTopColor: colors.border,
                                    }}
                                    onPress={() => {
                                        handleChange('location.country', country.name)
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={{ color: colors.text, flex: 1 }}>
                                        {country.name}
                                    </Text>
                                    {formData.location.country === country.name && (
                                        <FontAwesome
                                            name="check"
                                            size={16}
                                            color={colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    )
}


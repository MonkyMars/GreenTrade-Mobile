import { useState, useEffect, useRef } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    TextInput, Alert, Animated, Dimensions,
    Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import BottomNavigation from '../components/BottomNavigation'
import ProtectedRoute from 'components/ProtectedRoute'
import { useAuth } from 'lib/auth/AuthContext'
import { User } from 'lib/types/user'
import { useTheme } from 'lib/theme/ThemeContext'
import { isUrl } from 'lib/functions/isUrl'
import { useNavigation } from '@react-navigation/native'
import { updateUser } from 'lib/backend/auth/user'
import { CountryData, fetchCountriesInEurope } from 'lib/functions/countries'

type ActiveTab = 'profile' | 'seller' | 'security' | 'delete'
type ActiveInnerTab = 'listings' | 'favorites' | 'purchases'

export default function AccountScreen() {
    const { colors, isDark } = useTheme()
    const navigation = useNavigation()
    const [open, setOpen] = useState<boolean>(false)
    const { user: authUser, logout, loading: authLoading, reloadUser } = useAuth()
    const [user, setUser] = useState<User | null>(null)
    const [location, setLocation] = useState<{
        city: string
        country: string
    }>({
        city: "",
        country: ""
    })
    const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
    const [countries, setCountries] = useState<CountryData[]>([])
    const [deleteText, setDeleteText] = useState<string>('')
    const [updateSuccess, setUpdateSuccess] = useState<string>("")
    const [activeInnerTab, setActiveInnerTab] = useState<ActiveInnerTab>('listings')
    const [activeAppTab, setActiveAppTab] = useState<string>('account')
    const animationLock = useRef<boolean>(false)
    const previousTab = useRef<{
        activeTab: ActiveTab
        activeInnerTab: ActiveInnerTab
    }>({ activeTab, activeInnerTab })
    const [disabled, setDisabled] = useState<boolean>(false)

    // Animation values
    const slideAnim = useRef(new Animated.Value(0)).current
    const fadeAnim = useRef(new Animated.Value(1)).current
    const successFade = useRef(new Animated.Value(0)).current

    // Window dimensions
    const windowWidth = Dimensions.get("window").width

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

    useEffect(() => {
        if (!authLoading) {
            if (authUser) {
                // Update the user state with data from AuthContext
                setUser({
                    id: authUser.id || "",
                    name: authUser.name || "",
                    email: authUser.email || "",
                    location: authUser.location || "",
                    isSeller: authUser.isSeller || false,
                    profileUrl: authUser.profileUrl || "",
                    updated_at: authUser.updated_at || "",
                    created_at: authUser.created_at || "",
                    bio: authUser.bio || "",
                })
                const [city, country] = authUser.location.split(",")
                setLocation({
                    city: city.trim(),
                    country: country.trim()
                })
            }
        }
    }, [authUser, authLoading])


    useEffect(() => {
        if (!authLoading) {
            const equalName = user?.name === authUser?.name
            const equalLocation = user?.location === authUser?.location
            const equalBio = user?.bio === authUser?.bio

            if (!equalName || !equalLocation || !equalBio) {
                setDisabled(false)
            } else {
                setDisabled(true)
            }
        }
    }, [user])

    useEffect(() => {
        // Prevent firing if nothing actually changed
        if (
            previousTab.current.activeTab === activeTab &&
            previousTab.current.activeInnerTab === activeInnerTab
        ) return

        // Prevent firing if animation is already in progress
        if (animationLock.current) return

        animationLock.current = true
        previousTab.current = { activeTab, activeInnerTab } // Save new values

        // Fade out current content
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            // Reset slide
            slideAnim.setValue(windowWidth * 0.05)

            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                animationLock.current = false
            })
        })

        // Cleanup
        return () => {
            fadeAnim.stopAnimation()
            slideAnim.stopAnimation()
            animationLock.current = false
        }
    }, [activeTab, activeInnerTab])

    // Animation for success message
    useEffect(() => {
        if (updateSuccess) {
            Animated.sequence([
                Animated.timing(successFade, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.delay(2000),
                Animated.timing(successFade, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ]).start(() => setUpdateSuccess(''))
        }
    }, [updateSuccess])

    const handleTabPress = (tab: ActiveTab) => {
        setActiveTab(tab)
    }

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    onPress: async () => {
                        await logout()
                        navigation.navigate('Home')
                    }
                }
            ]
        )
    }

    const handleBecomeSeller = async () => {
        try {
            // In a real app, you would make an API call to become a seller
            // For now, we'll just simulate it with a delay
            if (user) {
                setUser({
                    ...user,
                    isSeller: true
                })
            }

            setUpdateSuccess(
                "You are now a seller! You can start listing your eco-friendly products."
            )
        } catch (error) {
            console.error("Error becoming seller:", error)
            Alert.alert("Error", "Failed to become a seller. Please try again.")
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteText.toLowerCase() !== "delete my account") {
            Alert.alert("Error", "Please type 'delete my account' to confirm.")
            return
        }

        try {
            // In a real app, you would make an API call to delete the account
            // For now, we'll just log out the user
            await logout()
            navigation.navigate('Home')
            Alert.alert("Success", "Your account has been deleted.")
        } catch (error) {
            console.error("Error deleting account:", error)
            Alert.alert("Error", "Failed to delete account. Please try again.")
        }
    }

    const handleUpdateUser = async () => {
        if (!user) return
        const formattedLocation = `${location.city}, ${location.country}`
        const updated = {
            name: user.name,
            location: formattedLocation,
            bio: user.bio,
        }
        try {
            const response = await updateUser(user.id, updated)
            if (response) {
                const updated: User = {
                    ...user,
                    name: response.name,
                    location: response.location,
                    bio: response.bio,
                }
                setUser(updated)
                setUpdateSuccess("Profile updated successfully.")
            } else {
                setUpdateSuccess("Failed to update profile.")
            }
        } catch (error) {
            console.error("Error updating user:", error)
            Alert.alert("Error", "Failed to update user. Please try again.")
        } finally {
            await reloadUser()
        }
    }

    return (
        <ProtectedRoute>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
                    {/* Header */}
                    <View style={{
                        backgroundColor: colors.card,
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 3,
                    }}>
                        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
                            <FontAwesome name="leaf" color={colors.primary} size={24} /> My GreenVue Account
                        </Text>
                    </View>

                    {/* User Profile Card */}
                    <View style={{
                        margin: 16,
                        padding: 16,
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    }}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: colors.primaryLight,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 12,
                                overflow: 'hidden'
                            }}>
                                {user && isUrl(user.profileImage as string) ? (
                                    <Image
                                        source={{ uri: user.profileUrl }}
                                        style={{ width: 80, height: 80 }}
                                    />
                                ) : (
                                    <Text style={{
                                        fontSize: 36,
                                        fontWeight: '700',
                                        color: colors.primary
                                    }}>
                                        {user ? user.name.charAt(0).toLocaleUpperCase() || 'U' : "U"}
                                    </Text>
                                )}
                            </View>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '700',
                                color: colors.text,
                                marginBottom: 4
                            }}>
                                {user?.name || 'User'}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                                marginBottom: 8
                            }}>
                                {user?.email || 'user@example.com'}
                            </Text>

                            {user?.isSeller && (
                                <View style={{
                                    backgroundColor: colors.primaryLight,
                                    paddingVertical: 4,
                                    paddingHorizontal: 10,
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: 8
                                }}>
                                    <MaterialCommunityIcons name="store" size={12} color={colors.primary} />
                                    <Text style={{
                                        marginLeft: 6,
                                        fontSize: 12,
                                        color: colors.primary,
                                        fontWeight: '500'
                                    }}>
                                        Seller
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Success message with animation */}
                        {updateSuccess !== '' && (
                            <Animated.View style={{
                                backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(209, 250, 229, 0.8)',
                                borderWidth: 1,
                                borderColor: colors.primary,
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: successFade
                            }}>
                                <FontAwesome name="check-circle" size={16} color={colors.primary} />
                                <Text style={{
                                    marginLeft: 8,
                                    color: colors.primary,
                                    flex: 1
                                }}>
                                    {updateSuccess}
                                </Text>
                            </Animated.View>
                        )}

                        {/* Tab navigation */}
                        <View style={{
                            backgroundColor: isDark ? colors.card : colors.background,
                            borderRadius: 8,
                            padding: 4,
                            marginBottom: 16
                        }}>
                            {['profile', 'seller', 'security', 'delete' as ActiveTab].map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        borderRadius: 6,
                                        backgroundColor:
                                            activeTab === tab && tab === 'delete' ? (isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(254, 226, 226, 0.8)') :
                                                activeTab === tab ? colors.primaryLight :
                                                    colors.card,
                                    }}
                                    onPress={() => handleTabPress(tab as ActiveTab)}
                                >
                                    <MaterialCommunityIcons
                                        name={
                                            tab === 'profile' ? 'account' :
                                                tab === 'seller' ? 'store' :
                                                    tab === 'security' ? 'shield' : 'delete'
                                        }
                                        size={16}
                                        color={tab === 'delete' ? colors.error :
                                            activeTab === tab ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={{
                                        marginLeft: 12,
                                        color: tab === 'delete' ? colors.error :
                                            activeTab === tab ? colors.primary : colors.textSecondary,
                                        fontWeight: activeTab === tab ? '600' : 'normal',
                                    }}>
                                        {tab === 'profile' ? 'Profile' :
                                            tab === 'seller' ? 'Seller Settings' :
                                                tab === 'security' ? 'Security' : 'Delete Account'}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    borderRadius: 6,
                                    marginTop: 4,
                                    backgroundColor: colors.card,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}
                                onPress={handleLogout}
                            >
                                <FontAwesome name="sign-out" size={16} color={colors.error} />
                                <Text style={{
                                    marginLeft: 12,
                                    color: colors.error,
                                }}>
                                    Log Out
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Account summary */}
                        <View style={{
                            backgroundColor: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.7)',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 20
                        }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.text,
                                marginBottom: 12
                            }}>
                                Account Summary
                            </Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: colors.textSecondary }}>Member since</Text>
                                <Text style={{ color: colors.text, fontWeight: '500' }}>
                                    {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: colors.textSecondary }}>Eco Score</Text>
                                <Text style={{ color: colors.primary, fontWeight: '500' }}>
                                    {user?.ecoScore || '0'}/5
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Tab Content with Animation */}
                    <Animated.View style={{
                        marginHorizontal: 16,
                        marginBottom: 16,
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }]
                    }}>
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <View style={{
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                padding: 16,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <FontAwesome name="user" size={18} color={colors.primary} />
                                    <Text style={{
                                        marginLeft: 10,
                                        fontSize: 18,
                                        fontWeight: '700',
                                        color: colors.text
                                    }}>
                                        Profile Information
                                    </Text>
                                </View>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        Full Name
                                    </Text>
                                    <TextInput
                                        defaultValue={user?.name}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            color: colors.text,
                                            backgroundColor: colors.background,
                                        }}
                                        onChange={(e => user ? setUser({ ...user, name: e.nativeEvent.text }) : null)}
                                        placeholderTextColor={colors.textTertiary}
                                    />
                                </View>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        Email Address
                                    </Text>
                                    <TextInput
                                        defaultValue={user?.email}
                                        editable={false}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            color: colors.textTertiary,
                                            backgroundColor: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.7)',
                                        }}
                                    />
                                    <Text style={{ marginTop: 4, fontSize: 12, color: colors.textTertiary }}>
                                        Email cannot be changed
                                    </Text>
                                </View>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        Country
                                    </Text>
                                    <View style={{ position: 'relative' }}>
                                        <View style={{ position: 'absolute', left: 12, top: 16, zIndex: 10 }}>
                                            <FontAwesome name='flag' size={16} color={colors.textTertiary} />
                                        </View>
                                        <TouchableOpacity
                                            style={{
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                borderRadius: 6,
                                                paddingHorizontal: 12,
                                                paddingVertical: 12,
                                                marginBottom: 4,
                                                backgroundColor: colors.background,
                                                flexDirection: 'row',
                                                paddingLeft: 40,
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                            onPress={() => setOpen(true)}
                                        >
                                            <Text
                                                style={{
                                                    color: location.country
                                                        ? colors.text
                                                        : colors.textTertiary,
                                                }}
                                            >
                                                {location.country || 'Select Country'}
                                            </Text>
                                            <FontAwesome
                                                name="chevron-down"
                                                size={14}
                                                color={colors.textTertiary}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        City
                                    </Text>
                                    <TextInput
                                        defaultValue={location.city}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            color: colors.text,
                                            backgroundColor: colors.background,
                                        }}
                                        onChange={(e => setLocation({ ...location, city: e.nativeEvent.text }))}
                                        placeholderTextColor={colors.textTertiary}
                                    />
                                </View>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        Bio
                                    </Text>
                                    <TextInput
                                        defaultValue={user?.bio || ''}
                                        multiline
                                        numberOfLines={4}
                                        style={{
                                            height: 100,
                                            textAlignVertical: 'top',
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            color: colors.text,
                                            backgroundColor: colors.background,
                                        }}
                                        placeholderTextColor={colors.textTertiary}
                                        onChange={(e => user ? setUser({ ...user, bio: e.nativeEvent.text }) : null)}
                                    />
                                </View>

                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 10
                                    }}>
                                        Profile Image
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: 30,
                                            backgroundColor: colors.primaryLight,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 16,
                                            overflow: 'hidden'
                                        }}>
                                            {user && isUrl(user.profileImage as string) ? (
                                                <Image
                                                    source={{ uri: user.profileUrl }}
                                                    style={{ width: 60, height: 60 }}
                                                />
                                            ) : (
                                                <Text style={{
                                                    fontSize: 24,
                                                    fontWeight: '700',
                                                    color: colors.primary
                                                }}>
                                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 10,
                                                paddingHorizontal: 14,
                                                borderRadius: 8,
                                                backgroundColor: colors.primaryLight,
                                                shadowColor: colors.shadow,
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 3,
                                                elevation: 1,
                                            }}
                                        >
                                            <FontAwesome name="camera" size={16} color={colors.primary} />
                                            <Text style={{
                                                marginLeft: 8,
                                                color: colors.primary,
                                                fontWeight: '600',
                                                fontSize: 14
                                            }}>
                                                Upload Photo
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={{
                                        backgroundColor: disabled ? colors.textTertiary : colors.primary,
                                        paddingVertical: 12,
                                        borderRadius: 6,
                                        alignItems: 'center',
                                        opacity: disabled ? 0.7 : 1,
                                    }}
                                    onPress={handleUpdateUser}
                                    disabled={disabled}
                                >
                                    <Text style={{
                                        color: 'white',
                                        fontWeight: '600',
                                        opacity: disabled ? 0.8 : 1
                                    }}>
                                        {disabled ? 'No Changes to Save' : 'Save Changes'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Activity Tabs */}
                                <View style={{ marginTop: 24 }}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontWeight: '700',
                                        color: colors.text,
                                        marginBottom: 16
                                    }}>
                                        Your Activity
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row',
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.border,
                                        marginBottom: 16
                                    }}>
                                        {['listings', 'favorites', 'purchases' as ActiveInnerTab].map((tab) => (
                                            <TouchableOpacity
                                                key={tab}
                                                style={{
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 16,
                                                    borderBottomWidth: 2,
                                                    borderBottomColor: activeInnerTab === tab ? colors.primary : 'transparent',
                                                    marginRight: 8
                                                }}
                                                onPress={() => setActiveInnerTab(tab as ActiveInnerTab)}
                                            >
                                                <Text style={{
                                                    color: activeInnerTab === tab ? colors.primary : colors.textSecondary,
                                                    fontWeight: activeInnerTab === tab ? '600' : 'normal',
                                                }}>
                                                    {tab === 'listings' ? 'Your Listings' :
                                                        tab === 'favorites' ? 'Favorites' : 'Purchases'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                        <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
                                            {activeInnerTab === 'listings'
                                                ? "You haven't created any listings yet."
                                                : activeInnerTab === 'favorites'
                                                    ? "You haven't saved any favorites yet."
                                                    : "No purchase history available."}
                                        </Text>

                                        {activeInnerTab === 'listings' && (
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: colors.primary,
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 16,
                                                    borderRadius: 6,
                                                }}
                                                onPress={() => navigation.navigate('Post')}
                                            >
                                                <Text style={{ color: 'white', fontWeight: '600' }}>
                                                    Create Your First Listing
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Seller Tab */}
                        {activeTab === 'seller' && (
                            <View style={{
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                padding: 16,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <MaterialCommunityIcons name="store" size={18} color={colors.primary} />
                                    <Text style={{
                                        marginLeft: 10,
                                        fontSize: 18,
                                        fontWeight: '700',
                                        color: colors.text
                                    }}>
                                        Seller Settings
                                    </Text>
                                </View>

                                {user?.isSeller ? (
                                    <>
                                        <View style={{
                                            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(209, 250, 229, 0.8)',
                                            borderWidth: 1,
                                            borderColor: colors.primary,
                                            borderRadius: 8,
                                            padding: 16,
                                            marginBottom: 20
                                        }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <FontAwesome name="check-circle" size={16} color={colors.primary} />
                                                <Text style={{
                                                    marginLeft: 10,
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    color: colors.text
                                                }}>
                                                    You are a verified seller
                                                </Text>
                                            </View>

                                            <Text style={{
                                                color: colors.textSecondary,
                                                marginBottom: 16
                                            }}>
                                                You can create listings and sell your eco-friendly products on GreenVue.
                                                Access your seller dashboard to manage your listings.
                                            </Text>

                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: colors.primary,
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 16,
                                                    borderRadius: 6,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: '600' }}>
                                                    Go to Seller Dashboard
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: colors.text,
                                            marginBottom: 16
                                        }}>
                                            Seller Information
                                        </Text>

                                        <View style={{ marginBottom: 16 }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '500',
                                                color: colors.textSecondary,
                                                marginBottom: 6
                                            }}>
                                                Business Name
                                            </Text>
                                            <TextInput
                                                defaultValue={''}
                                                style={{
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    borderRadius: 6,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    color: colors.text,
                                                    backgroundColor: colors.background,
                                                }}
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>

                                        <View style={{ marginBottom: 24 }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '500',
                                                color: colors.textSecondary,
                                                marginBottom: 6
                                            }}>
                                                Seller Bio / About Your (Business)
                                            </Text>
                                            <TextInput
                                                defaultValue={''}
                                                multiline
                                                numberOfLines={4}
                                                style={{
                                                    height: 100,
                                                    textAlignVertical: 'top',
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    borderRadius: 6,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    color: colors.text,
                                                    backgroundColor: colors.background,
                                                }}
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>

                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: colors.primary,
                                                paddingVertical: 12,
                                                borderRadius: 6,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: '600' }}>
                                                Update Seller Information
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={{
                                        backgroundColor: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.7)',
                                        borderRadius: 8,
                                        padding: 16,
                                        marginBottom: 8
                                    }}>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: colors.text,
                                            marginBottom: 8
                                        }}>
                                            Become a Seller on GreenVue
                                        </Text>

                                        <Text style={{
                                            color: colors.textSecondary,
                                            marginBottom: 16
                                        }}>
                                            Start selling your eco-friendly products to our community of environmentally
                                            conscious buyers. Becoming a seller is free and only takes a few minutes.
                                        </Text>

                                        <View style={{ marginBottom: 16 }}>
                                            {["Access to seller dashboard", "Create and manage your listings",
                                                "Connect with eco-conscious buyers", "Promote sustainable products"].map((item, index) => (
                                                    <View key={index} style={{ flexDirection: 'row', marginBottom: 8 }}>
                                                        <FontAwesome name="leaf" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                                                        <Text style={{ marginLeft: 10, color: colors.textSecondary }}>
                                                            {item}
                                                        </Text>
                                                    </View>
                                                ))}
                                        </View>

                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: colors.primary,
                                                paddingVertical: 12,
                                                borderRadius: 6,
                                                alignItems: 'center',
                                            }}
                                            onPress={handleBecomeSeller}
                                        >
                                            <Text style={{ color: 'white', fontWeight: '600' }}>
                                                Become a Seller
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <View style={{
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                padding: 16,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <FontAwesome name="shield" size={18} color={colors.primary} />
                                    <Text style={{
                                        marginLeft: 10,
                                        fontSize: 18,
                                        fontWeight: '700',
                                        color: colors.text
                                    }}>
                                        Security Settings
                                    </Text>
                                </View>

                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: colors.text,
                                    marginBottom: 16
                                }}>
                                    Change Password
                                </Text>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        Current Password
                                    </Text>
                                    <TextInput
                                        secureTextEntry
                                        style={{
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            color: colors.text,
                                            backgroundColor: colors.background,
                                        }}
                                        placeholderTextColor={colors.textTertiary}
                                    />
                                </View>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        New Password
                                    </Text>
                                    <TextInput
                                        secureTextEntry
                                        style={{
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            color: colors.text,
                                            backgroundColor: colors.background,
                                        }}
                                        placeholderTextColor={colors.textTertiary}
                                    />
                                </View>

                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: colors.textSecondary,
                                        marginBottom: 6
                                    }}>
                                        Confirm New Password
                                    </Text>
                                    <TextInput
                                        secureTextEntry
                                        style={{
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            color: colors.text,
                                            backgroundColor: colors.background,
                                        }}
                                        placeholderTextColor={colors.textTertiary}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={{
                                        backgroundColor: colors.primary,
                                        paddingVertical: 12,
                                        borderRadius: 6,
                                        alignItems: 'center',
                                        marginBottom: 24
                                    }}
                                >
                                    <Text style={{ color: 'white', fontWeight: '600' }}>
                                        Change Password
                                    </Text>
                                </TouchableOpacity>

                                <View style={{
                                    borderTopWidth: 1,
                                    borderTopColor: colors.border,
                                    paddingTop: 24,
                                    marginBottom: 8
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600',
                                        color: colors.text,
                                        marginBottom: 8
                                    }}>
                                        Login Sessions
                                    </Text>

                                    <Text style={{
                                        color: colors.textSecondary,
                                        marginBottom: 16
                                    }}>
                                        Manage your active login sessions. If you notice any suspicious activity,
                                        log out of all devices immediately.
                                    </Text>

                                    <TouchableOpacity
                                        style={{
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 6,
                                            paddingVertical: 12,
                                            alignItems: 'center',
                                            backgroundColor: colors.background,
                                        }}
                                    >
                                        <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
                                            Log out of all devices
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Delete Account Tab */}
                        {activeTab === 'delete' && (
                            <View style={{
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                padding: 16,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <FontAwesome name="trash" size={18} color={colors.error} />
                                    <Text style={{
                                        marginLeft: 10,
                                        fontSize: 18,
                                        fontWeight: '700',
                                        color: colors.text
                                    }}>
                                        Delete Account
                                    </Text>
                                </View>

                                <View style={{
                                    backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(254, 226, 226, 0.8)',
                                    borderWidth: 1,
                                    borderColor: colors.error,
                                    borderRadius: 8,
                                    padding: 16,
                                    marginBottom: 24
                                }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <FontAwesome name="exclamation-triangle" size={16} color={colors.error} style={{ marginTop: 2 }} />
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: colors.error,
                                                marginBottom: 8
                                            }}>
                                                Warning: This action cannot be undone
                                            </Text>
                                            <Text style={{ color: colors.textSecondary }}>
                                                Deleting your account will permanently remove all your data, including listings,
                                                messages, and purchase history. Your account cannot be recovered after deletion.
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {!showDeleteConfirm ? (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: colors.error,
                                            paddingVertical: 12,
                                            borderRadius: 6,
                                            alignItems: 'center',
                                        }}
                                        onPress={() => setShowDeleteConfirm(true)}
                                    >
                                        <Text style={{ color: 'white', fontWeight: '600' }}>
                                            Delete My Account
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: colors.text,
                                            marginBottom: 8
                                        }}>
                                            Confirm Account Deletion
                                        </Text>

                                        <Text style={{
                                            color: colors.textSecondary,
                                            marginBottom: 16
                                        }}>
                                            Please type <Text style={{ fontWeight: '700' }}>delete my account</Text> below to confirm:
                                        </Text>

                                        <TextInput
                                            value={deleteText}
                                            onChangeText={setDeleteText}
                                            style={{
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                borderRadius: 6,
                                                paddingHorizontal: 12,
                                                paddingVertical: 10,
                                                color: colors.text,
                                                backgroundColor: colors.background,
                                                marginBottom: 16
                                            }}
                                            placeholderTextColor={colors.textTertiary}
                                            placeholder="delete my account"
                                        />

                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: colors.error,
                                                    flex: 1,
                                                    paddingVertical: 12,
                                                    borderRadius: 6,
                                                    alignItems: 'center',
                                                }}
                                                onPress={handleDeleteAccount}
                                            >
                                                <Text style={{ color: 'white', fontWeight: '600' }}>
                                                    Permanently Delete Account
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={{
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    flex: 1,
                                                    paddingVertical: 12,
                                                    borderRadius: 6,
                                                    alignItems: 'center',
                                                    backgroundColor: colors.background,
                                                }}
                                                onPress={() => setShowDeleteConfirm(false)}
                                            >
                                                <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>

                <BottomNavigation activeTab={activeAppTab} onTabChange={() => setActiveAppTab} />
            </SafeAreaView>
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
                                        setLocation((prev) => ({ ...prev, country: country.name }));
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={{ color: colors.text, flex: 1 }}>
                                        {country.name}
                                    </Text>
                                    {location.country === country.name && (
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
        </ProtectedRoute>
    )
}
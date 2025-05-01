import { useState, useEffect, useRef } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    Animated, Dimensions, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import BottomNavigation, { Tab } from '../components/BottomNavigation'
import ProtectedRoute from 'components/ProtectedRoute'
import { useAuth } from 'lib/auth/AuthContext'
import { User } from 'lib/types/user'
import { useTheme } from 'lib/theme/ThemeContext'
import { isUrl } from 'lib/functions/isUrl'
import { useNavigation } from '@react-navigation/native'
import { CountryData, fetchCountriesInEurope } from 'lib/functions/countries'
import { getSellerListings } from 'lib/backend/listings/getListings'
import { FetchedListing } from 'lib/types/main'
import CustomAlert from 'components/CustomAlert'
import { useCustomAlert } from 'lib/hooks/useCustomAlert'
import ProfileTab from 'components/account/ProfileTab'
import SecurityTab from 'components/account/SecurityTab'
import DeleteAccountTab from 'components/account/DeleteAccountTab'

type ActiveTab = 'profile' | 'security' | 'delete'
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
    const [userListings, setUserListings] = useState<FetchedListing[]>([])
    const [countries, setCountries] = useState<CountryData[]>([])
    const [activeInnerTab, setActiveInnerTab] = useState<ActiveInnerTab>('listings')
    const [activeAppTab, setActiveAppTab] = useState<Tab["name"]>('account')
    const animationLock = useRef<boolean>(false)
    const previousTab = useRef<{
        activeTab: ActiveTab
        activeInnerTab: ActiveInnerTab
    }>({ activeTab, activeInnerTab })
    const { showAlert, isVisible, config, hideAlert } = useCustomAlert();

    // Animation values
    const slideAnim = useRef(new Animated.Value(0)).current
    const fadeAnim = useRef(new Animated.Value(1)).current

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
        const fetchUserListings = async () => {
            try {
                if (user) {
                    const response = await getSellerListings(user.id)
                    if (response) {
                        setUserListings(response)
                    }
                }
            } catch (error) {
                console.error('Error fetching user listings:', error)
            }
        }

        fetchUserListings()
    }, [user])

    useEffect(() => {
        if (!authLoading) {
            if (authUser) {
                // Update the user state with data from AuthContext
                setUser({
                    id: authUser.id || "",
                    name: authUser.name || "",
                    email: authUser.email || "",
                    location: authUser.location || "",
                    profileUrl: authUser.profileUrl || "",
                    updated_at: authUser.updated_at || "",
                    created_at: authUser.created_at || "",
                    bio: authUser.bio || "",
                })
                const [city, country] = authUser.location.split(",")
                setLocation({
                    city: city ? city.trim() : "",
                    country: country ? country.trim() : ""
                })
            }
        }
    }, [authUser, authLoading])

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

    const handleTabPress = (tab: ActiveTab) => {
        setActiveTab(tab)
    }

    const handleLogout = async () => {
        showAlert({
            title: "Logout",
            message: "Are you sure you want to log out?",
            buttons: [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: hideAlert
                },
                {
                    text: "Logout",
                    onPress: async () => {
                        await logout()
                        navigation.navigate('Home')
                    }
                }
            ]
        })
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
                            <FontAwesome name="leaf" color={colors.primary} size={24} /> My GreenTrade Account
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

                            {userListings.length > 0 && (
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

                        {/* Tab navigation */}
                        <View style={{
                            backgroundColor: isDark ? colors.card : colors.background,
                            borderRadius: 8,
                            padding: 4,
                            marginBottom: 16
                        }}>
                            {['profile', 'security', 'delete' as ActiveTab].map((tab) => (
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
                            <ProfileTab
                                user={user}
                                setUser={setUser}
                                location={location}
                                setLocation={setLocation}
                                countries={countries}
                                setOpen={setOpen}
                                reloadUser={reloadUser}
                                colors={colors}
                                isDark={isDark}
                                showAlert={showAlert}
                            />
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <SecurityTab
                                colors={colors}
                            />
                        )}

                        {/* Delete Account Tab */}
                        {activeTab === 'delete' && (
                            <DeleteAccountTab
                                colors={colors}
                                isDark={isDark}
                                logout={logout}
                                showAlert={showAlert}
                            />
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
            <CustomAlert
                visible={isVisible}
                title={config.title}
                message={config.message}
                buttons={config.buttons}
                type={config.type}
            />
        </ProtectedRoute>
    )
}
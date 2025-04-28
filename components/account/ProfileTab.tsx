import { useState, useEffect, useRef } from 'react'
import {
    View, Text, TouchableOpacity, Image, TextInput, Animated,
    ScrollView
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { User } from 'lib/types/user'
import { isUrl } from 'lib/functions/isUrl'
import { updateUser } from 'lib/backend/auth/user'
import { CountryData } from 'lib/functions/countries'
import { useNavigation } from '@react-navigation/native'
import { FetchedListing } from 'lib/types/main'
import { getSellerListings } from 'lib/backend/listings/getListings'
import ActivityTabs from './ActivityTabs'

type ActiveInnerTab = 'listings' | 'favorites' | 'purchases'

interface ProfileTabProps {
    user: User | null
    setUser: React.Dispatch<React.SetStateAction<User | null>>
    location: {
        city: string
        country: string
    }
    setLocation: React.Dispatch<React.SetStateAction<{
        city: string
        country: string
    }>>
    countries: CountryData[]
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    reloadUser: () => Promise<void>
    colors: any
    isDark: boolean
    showAlert: (config: any) => void
    userListings?: FetchedListing[]
}

export default function ProfileTab({
    user,
    setUser,
    location,
    setLocation,
    countries,
    setOpen,
    reloadUser,
    colors,
    isDark,
    showAlert,
    userListings: initialUserListings = []
}: ProfileTabProps) {
    const navigation = useNavigation()
    const [disabled, setDisabled] = useState<boolean>(true)
    const [updateSuccess, setUpdateSuccess] = useState<string>("")
    const successFade = useRef(new Animated.Value(0)).current
    const [activeInnerTab, setActiveInnerTab] = useState<ActiveInnerTab>('listings')
    const [userListings, setUserListings] = useState<FetchedListing[]>(initialUserListings)
    const [loadingListings, setLoadingListings] = useState<boolean>(false)

    // Fetch user listings if not provided
    useEffect(() => {
        if (initialUserListings.length > 0) {
            setUserListings(initialUserListings)
            return
        }

        const fetchUserListings = async () => {
            if (!user?.id) return

            try {
                setLoadingListings(true)
                const response = await getSellerListings(user.id)
                if (response) {
                    setUserListings(response)
                }
            } catch (error) {
                console.error('Error fetching user listings:', error)
            } finally {
                setLoadingListings(false)
            }
        }

        fetchUserListings()
    }, [user?.id])

    useEffect(() => {
        if (user) {
            const authUser = user;
            const equalName = user?.name === authUser?.name
            const equalLocation = user?.location === `${location.city}, ${location.country}`
            const equalBio = user?.bio === authUser?.bio

            if (!equalName || !equalLocation || !equalBio) {
                setDisabled(false)
            } else {
                setDisabled(true)
            }
        }
    }, [user, location])

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
            showAlert({
                title: "Error",
                message: "Failed to update user. Please try again.",
                buttons: [{ text: "OK" }]
            })
        } finally {
            await reloadUser()
        }
    }

    return (
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

            {/* Activity Tabs Component */}
            <ActivityTabs
                userListings={userListings}
                activeInnerTab={activeInnerTab}
                setActiveInnerTab={setActiveInnerTab}
                colors={colors}
                navigation={navigation}
                userId={user?.id}
            />
        </View>
    )
}
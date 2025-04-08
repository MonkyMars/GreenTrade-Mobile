import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../lib/theme/ThemeContext'
import { Feather, FontAwesome } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from './navigation'
import { FetchedListing } from 'lib/types/main'
import { getListings } from 'lib/backend/listings/getListings'
import { findCategory } from '../lib/functions/category'
import { useAuth } from 'lib/auth/AuthContext'
import { greeting } from 'lib/functions/greeting'

export default function HomeScreen() {
  const { colors, isDark } = useTheme()
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [activeTab, setActiveTab] = useState('home')
  const [username, setUsername] = useState('User')
  const [recentListings, setRecentListings] = useState<FetchedListing[]>([])
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()

  // Fetch user data and recent listings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (user?.name) {
          setUsername(user.name)
        }

        try {
          // Fetch recent listings from API
          const listings = await getListings()
          // Get only the 3 most recent listings
          if (Array.isArray(listings)) {
            setRecentListings(listings.slice(0, 3))
          } else {
            console.error('Listings is not an array:', listings)
            setRecentListings([])
          }
        } catch (listingError) {
          console.error('Error fetching listings:', listingError)
          setRecentListings([])
        }
      } catch (error) {
        console.error('Error fetching home page data:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only run the effect if auth is not loading
    if (!authLoading) {
      fetchData()
    }
  }, [user, authLoading])

  // Handler for navigating to listing details
  const handleListingPress = (id: number) => {
    // In a real app, you would navigate to the listing details screen
    console.log(`Navigating to listing ${id}`)
    // For now, we'll navigate to listings page
    navigation.navigate('Listings')
  }

  // Safe function to get category - handles null case
  const getSafeCategory = (categoryName: string) => {
    if (!categoryName) return { name: 'Unknown', icon: 'tag' }
    const category = findCategory(categoryName)
    return category || { name: 'Unknown', icon: 'tag' }
  }

  if (authLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 10, color: '#9ca3af' }}>Loading...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        position: 'relative',
        width: '100%',
      }}
    >
      {/* App Header */}
      <View
        style={{
          backgroundColor: colors.card,
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome name="leaf" size={24} color={colors.primary} />
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: colors.text,
              marginLeft: 10,
            }}
          >
            GreenTrade
          </Text>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <ScrollView
          style={{
            flex: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting Section */}
          <View style={styles.section}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: colors.text,
              }}
            >
              {username
                ? greeting() + ', ' + username.split(' ')[0] + '!'
                : 'Welcome!'}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginTop: 5,
              }}
            >
              Welcome to your sustainable marketplace
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, styles.quickActionsContainer]}>
            <TouchableOpacity
              style={{
                ...styles.actionButton,
                backgroundColor: colors.primary,
              }}
              onPress={() => navigation.navigate('Listings')}
            >
              <Feather name="search" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Browse Listings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                ...styles.actionButton,
                backgroundColor: isDark ? colors.primaryLight : colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderStyle: 'solid',
              }}
              onPress={() => navigation.navigate('Post')}
            >
              <Feather
                name="plus"
                size={24}
                color={isDark ? '#fff' : colors.textTertiary}
              />
              <Text
                style={{
                  ...styles.actionButtonText,
                  color: isDark ? colors.text : colors.textTertiary,
                }}
              >
                Post a Listing
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Listings Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.text,
                }}
              >
                Recent Listings
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Listings')}>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Listings */}
            {loading ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.listingsContainer}>
                {recentListings.length > 0 ? (
                  recentListings.map(item => {
                    // Using our safe function to get category
                    const category = getSafeCategory(item.category)
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={{
                          ...styles.listingCard,
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }}
                        onPress={() => handleListingPress(item.id)}
                      >
                        <Image
                          source={{
                            uri: Array.isArray(item.imageUrl)
                              ? item.imageUrl[0]
                              : item.imageUrl.urls && item.imageUrl.urls[0]
                                ? item.imageUrl.urls[0]
                                : 'https://via.placeholder.com/300x200',
                          }}
                          style={styles.listingImage}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            backgroundColor: isDark
                              ? 'rgba(31, 41, 55, 0.8)'
                              : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 4,
                            paddingHorizontal: 6,
                            paddingVertical: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <FontAwesome
                            name="leaf"
                            size={14}
                            color={colors.primary}
                          />
                          <Text
                            style={{
                              marginLeft: 4,
                              fontWeight: '600',
                              color: colors.text,
                            }}
                          >
                            {item.ecoScore}
                          </Text>
                        </View>
                        <View style={styles.listingDetails}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: colors.text,
                              marginBottom: 4,
                            }}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: 'bold',
                              color: colors.primary,
                              marginBottom: 4,
                            }}
                          >
                            €{item.price}
                          </Text>

                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginTop: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                color: colors.textTertiary,
                              }}
                            >
                              <Feather
                                name="map-pin"
                                size={12}
                                color={colors.textTertiary}
                              />{' '}
                              {item.location}
                            </Text>

                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                            >
                              <FontAwesome
                                name={category.icon as any}
                                size={12}
                                color={colors.primary}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={{ fontSize: 12, color: colors.primary }}
                              >
                                {category.name}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )
                  })
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: colors.textTertiary }}>
                      No listings found
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Featured Section */}
          <View style={[styles.section, { marginBottom: 20 }]}>
            <View style={styles.featuredCard}>
              <View
                style={{
                  backgroundColor: isDark
                    ? colors.primaryLight
                    : colors.primaryLight,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: isDark ? colors.text : colors.primaryDark,
                    marginBottom: 10,
                  }}
                >
                  Make an Impact
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? colors.textSecondary : colors.primaryDark,
                    marginBottom: 16,
                    opacity: 0.8,
                  }}
                >
                  Buying and selling sustainable goods helps reduce waste and
                  promotes a circular economy. Join our community!
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => navigation.navigate('Post')}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    Get Started
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 0.48,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  listingsContainer: {
    gap: 15,
  },
  listingCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 10,
  },
  listingImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  listingDetails: {
    padding: 12,
  },
  featuredCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
})

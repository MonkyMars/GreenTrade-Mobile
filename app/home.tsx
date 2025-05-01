import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNavigation, { Tab } from '../components/BottomNavigation'
import { useTheme } from '../lib/theme/ThemeContext'
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { FetchedListing } from 'lib/types/main'
import { getListings } from 'lib/backend/listings/getListings'
import { categories, findCategory } from '../lib/functions/category'
import { useAuth } from 'lib/auth/AuthContext'
import { greeting } from 'lib/functions/greeting'
import { ListingListItem } from 'components/ListingItem'

export default function HomeScreen() {
  const { colors, isDark } = useTheme()
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState<Tab["name"]>('home')
  const [username, setUsername] = useState('User')
  const [recentListings, setRecentListings] = useState<FetchedListing[]>([])
  const [featuredListings, setFeaturedListings] = useState<FetchedListing[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { width: screenWidth } = Dimensions.get('window')

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const bannerAnim = useRef(new Animated.Value(0)).current

  // Fetch listings data
  const fetchData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      if (user?.name) {
        setUsername(user.name)
      }

      // Fetch listings from API
      const listings = await getListings()

      if (Array.isArray(listings)) {
        // Recent listings - most recently added
        setRecentListings(listings.slice(0, 5))

        // Featured listings - highest eco score
        const featured = [...listings].sort((a, b) => b.ecoScore - a.ecoScore).slice(0, 5)
        setFeaturedListings(featured)
      } else {
        console.error('Listings is not an array:', listings)
        setRecentListings([])
        setFeaturedListings([])
      }

    } catch (error) {
      console.error('Error fetching home page data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [user, authLoading])

  // Start animations when component mounts
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(bannerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [loading])

  // Navigate to listing detail
  const handleListingPress = (id: string) => {
    navigation.navigate('ListingDetail', { id })
  }

  // Navigate to post screen
  const handlePostPress = () => {
    navigation.navigate('Post')
  }

  // Navigate to listings screen
  const handleBrowsePress = () => {
    navigation.navigate('Listings')
  }

  // Handle refresh
  const onRefresh = () => {
    fetchData(true)
  }

  // Header animation based on scroll position
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  // Get first image from listing
  const getFirstImage = (imageUrl: string[] | { urls: string[] }) => {
    if (Array.isArray(imageUrl)) {
      return imageUrl[0] || 'https://via.placeholder.com/300x200'
    } else if (imageUrl.urls && Array.isArray(imageUrl.urls)) {
      return imageUrl.urls[0] || 'https://via.placeholder.com/300x200'
    }
    return 'https://via.placeholder.com/300x200'
  }

  // Render a featured listing slide
  const renderFeaturedItem = ({ item, index }: { item: FetchedListing, index: number }) => {
    const category = findCategory(item.category)

    return (
      <TouchableOpacity
        key={index}
        style={{
          width: screenWidth - 48,
          marginRight: 16,
          borderRadius: 12,
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          overflow: 'hidden',
        }}
        activeOpacity={0.9}
        onPress={() => handleListingPress(item.id)}
      >
        {/* Featured image */}
        <View style={{ height: 200, position: 'relative' }}>
          <Image
            source={{ uri: getFirstImage(item.imageUrl) }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {/* Eco score badge */}
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FontAwesome name="leaf" size={14} color={colors.primary} />
            <Text style={{ marginLeft: 4, fontWeight: '600', color: colors.text }}>
              {item.ecoScore}/5
            </Text>
          </View>

          {/* Category tag */}
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: colors.primary,
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FontAwesome name={category.icon as any} size={12} color="white" />
            <Text style={{ marginLeft: 4, color: 'white', fontWeight: '600', fontSize: 12 }}>
              {category.name}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: 8,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.primary,
              }}
            >
              €{item.price}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  padding: 4,
                  borderRadius: 12,
                  marginRight: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Feather name="map-pin" size={12} color={colors.primary} />
                <Text style={{ marginHorizontal: 4, color: colors.primary, fontSize: 12 }}>
                  {item.location.split(',')[0]}
                </Text>
              </View>

              {item.sellerVerified && (
                <View
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: 12,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 12 }}>Verified ✓</Text>
                </View>
              )}
            </View>
          </View>

          <Text
            style={{
              marginTop: 8,
              color: colors.textSecondary,
              fontSize: 14,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>

        {/* Bottom section with seller info */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {item.sellerUsername.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {item.sellerUsername}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="star" size={12} color={colors.rating} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>
                  {item.sellerRating}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
            onPress={() => handleListingPress(item.id)}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              View
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  if (authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Animated header that appears on scroll */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 90,
          paddingTop: 30,
          backgroundColor: colors.card,
          opacity: headerHeight,
          zIndex: 100,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        }}
      >
        <FontAwesome name="leaf" size={24} color={colors.primary} />
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginLeft: 10,
          }}
        >
          GreenTrade
        </Text>

        <TouchableOpacity
          style={{
            marginLeft: 'auto',
            width: 35,
            height: 35,
            borderRadius: 20,
            backgroundColor: colors.primaryLight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('Account')}
        >
          <FontAwesome name="user" size={16} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header Section */}
        <Animated.View
          style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 8,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="leaf" size={28} color={colors.primary} />
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginLeft: 10 }}>
                GreenTrade
              </Text>
            </View>

            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('Account')}
            >
              {user?.profileUrl ? (
                <Image
                  source={{ uri: user.profileUrl }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
              {greeting()}, {username.split(' ')[0]}!
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 4 }}>
              Find sustainable products from eco-conscious sellers
            </Text>
          </View>
        </Animated.View>

        {/* Search & Action Buttons */}
        <Animated.View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 16,
            }}
            onPress={() => navigation.navigate('Listings')}
          >
            <Feather name="search" size={20} color={colors.textSecondary} />
            <Text style={{ marginLeft: 10, color: colors.textSecondary, flex: 1 }}>
              Search listings...
            </Text>
            <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 12 }}>Go</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={{
                flex: 1,
                marginRight: 8,
                height: 90,
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                justifyContent: 'space-between',
              }}
              onPress={handlePostPress}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome name="plus-circle" size={22} color="white" />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
                  Sell
                </Text>
              </View>
              <Text style={{ color: 'white', opacity: 0.8, fontSize: 12 }}>
                Create a new listing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                marginLeft: 8,
                height: 90,
                backgroundColor: isDark ? colors.primaryLight : colors.card,
                borderRadius: 12,
                padding: 16,
                justifyContent: 'space-between',
                borderWidth: isDark ? 0 : 1,
                borderColor: colors.border,
              }}
              onPress={handleBrowsePress}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="compass" size={22} color={isDark ? 'white' : colors.primary} />
                <Text
                  style={{
                    color: isDark ? 'white' : colors.primary,
                    fontWeight: '600',
                    fontSize: 16,
                    marginLeft: 8,
                  }}
                >
                  Browse
                </Text>
              </View>
              <Text
                style={{
                  color: isDark ? 'white' : colors.textSecondary,
                  opacity: 0.8,
                  fontSize: 12,
                }}
              >
                Discover items
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Featured Listings */}
            <Animated.View
              style={{
                marginTop: 16,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="star-circle" size={22} color={colors.primary} />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 8 }}>
                    Featured
                  </Text>
                </View>
                <TouchableOpacity onPress={handleBrowsePress}>
                  <Text style={{ color: colors.primary, fontWeight: '500' }}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={featuredListings}
                renderItem={renderFeaturedItem}
                keyExtractor={item => `featured-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
                ListEmptyComponent={
                  <View style={{ width: screenWidth - 48, height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12 }}>
                    <Text style={{ color: colors.textTertiary }}>No featured listings</Text>
                  </View>
                }
              />
            </Animated.View>

            {/* Banner */}
            <Animated.View
              style={{
                marginTop: 24,
                marginHorizontal: 24,
                backgroundColor: colors.primaryLight,
                borderRadius: 12,
                padding: 16,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                opacity: bannerAnim,
                transform: [
                  {
                    scale: bannerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1]
                    })
                  }
                ],
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: isDark ? colors.text : colors.primaryDark,
                      marginBottom: 8,
                    }}
                  >
                    Make an Impact
                  </Text>
                  <Text
                    style={{
                      color: isDark ? colors.textSecondary : colors.primaryDark,
                      marginBottom: 16,
                      opacity: 0.8,
                      lineHeight: 20,
                    }}
                  >
                    Buy and sell sustainable goods to reduce waste and promote a circular economy.
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={handlePostPress}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginLeft: 16, justifyContent: 'center' }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                    elevation: 5,
                  }}>
                    <FontAwesome name="leaf" size={24} color={colors.primary} />
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Recent Listings */}
            <Animated.View
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="clock" size={20} color={colors.primary} />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 8 }}>
                    Recent Listings
                  </Text>
                </View>
                <TouchableOpacity onPress={handleBrowsePress}>
                  <Text style={{ color: colors.primary, fontWeight: '500' }}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              {recentListings.length > 0 ? (
                recentListings.map((item) => (
                  <Animated.View key={`recent-${item.id}`}>
                    <ListingListItem
                      item={item}
                      onPress={() => handleListingPress(item.id)}
                    />
                  </Animated.View>
                ))
              ) : (
                <View style={{
                  height: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  marginBottom: 24
                }}>
                  <Text style={{ color: colors.textTertiary }}>No recent listings</Text>
                </View>
              )}
            </Animated.View>

            {/* Categories Section */}
            <Animated.View
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                marginBottom: 24,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="grid-outline" size={20} color={colors.primary} />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 8 }}>
                    Categories
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      width: '31%',
                      height: 90,
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      marginBottom: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    onPress={() => navigation.navigate('Listings', { category: category.id })}
                  >
                    <FontAwesome name={category.icon as any} size={24} color={colors.primary} />
                    <Text style={{ marginTop: 8, color: colors.text }}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </Animated.ScrollView>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  )
}
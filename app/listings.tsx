import { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from './navigation'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../lib/theme/ThemeContext'
import { categories, cleanCategory, findCategory } from "../lib/functions/category"
import { FetchedListing } from 'lib/types/main'
import { getListings } from 'lib/backend/listings/getListings'
type ListingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Listings'
>

export default function ListingsScreen({ navigation }: ListingsScreenProps) {
  const { width } = useWindowDimensions()
  const { colors, isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('listings')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [originalListings, setOriginalListings] = useState<FetchedListing[]>([])
  const [listings, setListings] = useState<FetchedListing[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const slideAnim = useRef(new Animated.Value(width)).current

  // Animation effect for sidebar
  useEffect(() => {
    if (isFilterOpen) {
      // Slide in from right
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start()
    } else {
      // Slide out to right
      Animated.spring(slideAnim, {
        toValue: width,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }).start()
    }
  }, [isFilterOpen, slideAnim, width])

  // Function to handle opening and closing the filter
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen)
  }

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      try {
        const response = await getListings()
        setOriginalListings(response as FetchedListing[])
        setListings(response as FetchedListing[])
      } catch (error) {
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  // Calculate column width for grid view
  const numColumns = 2
  const columnWidth = (width - 48) / numColumns // 48 = padding (16) * 3

  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (categoryId === 'all') {
      setListings(originalListings)
    } else {
      setListings(
        originalListings.filter(item => cleanCategory(item.category) === cleanCategory(categoryId)),
      )
    }
  }

  // Render an item in grid view
  const renderGridItem = ({ item }: { item: FetchedListing }) => {
    const category = findCategory(item.category)

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')} // Replace with detail screen when available
        style={{
          width: columnWidth,
          backgroundColor: colors.card,
          marginBottom: 16,
          borderRadius: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 150, position: 'relative' }}>
          <Image
            source={{ uri: item.imageUrl[0] }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
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
            <FontAwesome name="leaf" size={14} color={colors.primary} />
            <Text
              style={{ marginLeft: 4, fontWeight: '600', color: colors.text }}
            >
              {item.ecoScore}
            </Text>
          </View>
        </View>

        <View style={{ padding: 12 }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 16,
              fontWeight: '500',
              marginBottom: 4,
              color: colors.text,
            }}
          >
            {item.title}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              marginTop: 4,
            }}
          >
            <Text
              style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}
            >
              €{item.price}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textTertiary,
                marginLeft: 4,
              }}
            >
              Exc. Shipping
            </Text>
          </View>

          <View style={{ marginTop: 8, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome
                name="map-marker"
                size={14}
                color={colors.textTertiary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 13, color: colors.textTertiary }}
                numberOfLines={1}
              >
                {item.location}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name={category.icon}
                size={14}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 13, color: colors.primary }}>
                {item.category}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: isDark
                ? 'rgba(55, 65, 81, 0.6)'
                : 'rgba(209, 213, 219, 0.6)',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.seller.verified && (
                <View
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: 10,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    marginRight: 4,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 10 }}>✓</Text>
                </View>
              )}
              <Text style={{ fontSize: 13, color: colors.primary }}>
                {item.seller.name}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 6,
                }}
              >
                <FontAwesome name="star" size={10} color={colors.rating} />
                <Text
                  style={{
                    fontSize: 12,
                    marginLeft: 2,
                    color: colors.textSecondary,
                  }}
                >
                  {item.seller.rating}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 4 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.textTertiary,
                display: 'flex',
              }}
            >
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
              }}
              onPress={() => console.log(`View seller ${item.seller.id}`)}
            >
              <FontAwesome name="user" size={12} color={colors.textSecondary} />
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Seller
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                backgroundColor: colors.primary,
                borderRadius: 6,
              }}
              onPress={() => console.log(`View details for item ${item.id}`)}
            >
              <FontAwesome name="eye" size={12} color="white" />
              <Text style={{ marginLeft: 4, fontSize: 12, color: 'white' }}>
                Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Render an item in list view
  const renderListItem = ({ item }: { item: FetchedListing }) => {
    const category = findCategory(item.category)

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')} // Replace with detail screen when available
        style={{
          backgroundColor: colors.card,
          marginBottom: 16,
          borderRadius: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
          overflow: 'hidden',
          flexDirection: 'row',
          padding: 12, // Added padding for better spacing
        }}
      >
        <Image
          source={{ uri: item.imageUrl[0] }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 8,
            marginRight: 12, // Added margin for spacing
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              color: colors.primary,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            €{item.price}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textTertiary,
              marginBottom: 4,
            }}
          >
            {item.location} • {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name={category.icon}
              size={14}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: colors.primary,
              }}
            >
              {category.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
      {/* Header */}
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
          width: '100%',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text
              style={{ fontSize: 24, fontWeight: '700', color: colors.text }}
            >
              Browse Listings
            </Text>
            <Text
              style={{ fontSize: 14, color: colors.textTertiary, marginTop: 4 }}
            >
              {listings.length} items across Europe
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 6,
            }}
            onPress={toggleFilter}
          >
            <FontAwesome name="filter" size={16} color={colors.textSecondary} />
            <Text
              style={{
                marginLeft: 8,
                color: colors.textSecondary,
                fontWeight: '500',
                fontSize: 14,
              }}
            >
              Filters
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            maxWidth: '100%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              maxWidth: '100%',
              flex: 1,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                style={{
                  padding: 8,
                  backgroundColor:
                    viewMode === 'grid' ? colors.highlight : colors.card,
                }}
                onPress={() => setViewMode('grid')}
              >
                <Feather
                  name="grid"
                  size={20}
                  color={
                    viewMode === 'grid' ? colors.primary : colors.textTertiary
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  padding: 8,
                  backgroundColor:
                    viewMode === 'list' ? colors.highlight : colors.card,
                }}
                onPress={() => setViewMode('list')}
              >
                <Feather
                  name="list"
                  size={20}
                  color={
                    viewMode === 'list' ? colors.primary : colors.textTertiary
                  }
                />
              </TouchableOpacity>
            </View>

            <View style={{ marginLeft: 12, flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  flexDirection: 'row',
                }}
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 6,
                }}
              >
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      gap: 6,
                      backgroundColor:
                        selectedCategory === category.id
                          ? colors.highlight
                          : 'transparent',
                      borderRadius: 4,
                    }}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <FontAwesome
                      name={category.icon}
                      size={16}
                      color={
                        selectedCategory === category.id
                          ? colors.primary
                          : colors.textTertiary
                      }
                    />
                    <Text
                      style={{
                        color:
                          selectedCategory === category.id
                            ? colors.primary
                            : colors.textSecondary,
                        fontWeight: '500',
                        fontSize: 14,
                      }}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>

      {/* Filter sidebar (modal for mobile) with animation */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isFilterOpen ? colors.filterBackground : 'transparent',
          zIndex: 10,
          pointerEvents: isFilterOpen ? 'auto' : 'none',
        }}
      >
        {/* Touchable area outside sidebar to close it */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={0.7}
          onPress={() => setIsFilterOpen(false)}
        />

        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '80%',
            backgroundColor: colors.card,
            padding: 16,
            shadowColor: colors.shadow,
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              marginTop: 22,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: colors.text }}
            >
              Filters
            </Text>
            <TouchableOpacity
              onPress={() => setIsFilterOpen(false)}
              style={{
                padding: 8,
                backgroundColor: colors.border,
                borderRadius: 20,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Search */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Search
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Feather name="search" size={18} color={colors.textTertiary} />
                <TextInput
                  placeholder="What are you looking for?"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingLeft: 8,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Categories */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Categories
              </Text>
              <View style={{ gap: 8 }}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor:
                        selectedCategory === category.id
                          ? colors.highlight
                          : 'transparent',
                      borderRadius: 8,
                    }}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <FontAwesome
                      name={category.icon}
                      size={18}
                      color={
                        selectedCategory === category.id
                          ? colors.primary
                          : colors.textTertiary
                      }
                    />
                    <Text
                      style={{
                        marginLeft: 12,
                        color:
                          selectedCategory === category.id
                            ? colors.primary
                            : colors.textSecondary,
                        fontWeight: '500',
                        fontSize: 14,
                      }}
                    >
                      {category.name}
                    </Text>
                    {selectedCategory === category.id && (
                      <Text
                        style={{ marginLeft: 'auto', color: colors.primary }}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Price Range
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <TextInput
                  placeholder="Min"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: colors.text,
                    backgroundColor: colors.card,
                  }}
                />
                <Text style={{ color: colors.textTertiary }}>-</Text>
                <TextInput
                  placeholder="Max"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: colors.text,
                    backgroundColor: colors.card,
                  }}
                />
              </View>
            </View>

            {/* Eco Score */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Minimum Eco Score
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: colors.card,
                }}
              >
                <Text style={{ color: colors.text }}>Any Score</Text>
              </View>
            </View>

            {/* Location */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Location
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: colors.card,
                }}
              >
                <Text style={{ color: colors.text }}>All Europe</Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 6,
                alignItems: 'center',
                marginTop: 8,
              }}
              onPress={() => setIsFilterOpen(false)}
            >
              <Text
                style={{ color: 'white', fontWeight: '600', fontSize: 16 }}
              >
                Apply Filters
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Listings */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          keyExtractor={item => item.id.toString()}
          numColumns={viewMode === 'grid' ? numColumns : 1}
          key={viewMode === 'grid' ? 'grid' : 'list'}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 80, // Extra padding for bottom navigation
          }}
          columnWrapperStyle={
            viewMode === 'grid'
              ? { justifyContent: 'space-between' }
              : undefined
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 16, color: colors.textTertiary }}>
                No listings found
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  )
}

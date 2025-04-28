import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import { FetchedListing } from 'lib/types/main'
import { ListingListItem } from 'components/ListingItem'
import { getFavorites } from 'lib/backend/favorites/getFavorites'

type ActiveInnerTab = 'listings' | 'favorites' | 'purchases'

interface ActivityTabsProps {
    userListings: FetchedListing[]
    activeInnerTab: ActiveInnerTab
    setActiveInnerTab: (tab: ActiveInnerTab) => void
    colors: any
    navigation: any
    userId?: string
}

export default function ActivityTabs({
    userListings,
    activeInnerTab,
    setActiveInnerTab,
    colors,
    navigation,
    userId
}: ActivityTabsProps) {
    const [favorites, setFavorites] = useState<FetchedListing[]>([])
    const [purchases, setPurchases] = useState<FetchedListing[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    // Fetch favorites and purchases if needed
    useEffect(() => {
        const fetchFavorites = async () => {
            if (activeInnerTab === 'favorites' && favorites.length === 0) {
                if (!userId) return;
                setLoading(true)

                try {
                    const favorites = await getFavorites(userId)
                    setFavorites(favorites)
                } finally {
                    setLoading(false)
                }
            }
        }

        const fetchPurchases = async () => {
            if (activeInnerTab === 'purchases' && purchases.length === 0) {
                if (!userId) return;
                try {

                } finally {

                }
            }
        }

        fetchFavorites()
        fetchPurchases()
    }, [activeInnerTab, userId])

    const renderListingItem = ({ item }: { item: FetchedListing }) => {
        const handleListingPress = (id: string) => {
            navigation.navigate('ListingDetail', { id })
        }
        return (
            <ListingListItem
                item={item}
                onPress={() => handleListingPress(item.id)}
                columnWidth={2}
            />
        )
    }

    return (
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

            {loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>Loading...</Text>
                </View>
            ) : (
                <>
                    {activeInnerTab === 'listings' && (
                        userListings.length > 0 ? (
                            <FlatList
                                data={userListings}
                                renderItem={renderListingItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 16 }}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
                                    You haven't created any listings yet.
                                </Text>
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
                            </View>
                        )
                    )}

                    {activeInnerTab === 'favorites' && (
                        favorites.length > 0 ? (
                            <FlatList
                                data={favorites}
                                renderItem={renderListingItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 16 }}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                <Text style={{ color: colors.textSecondary }}>
                                    You haven't saved any favorites yet.
                                </Text>
                            </View>
                        )
                    )}

                    {activeInnerTab === 'purchases' && (
                        purchases.length > 0 ? (
                            <FlatList
                                data={purchases}
                                renderItem={renderListingItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 16 }}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                <Text style={{ color: colors.textSecondary }}>
                                    No purchase history available.
                                </Text>
                            </View>
                        )
                    )}
                </>
            )}
        </View>
    )
}
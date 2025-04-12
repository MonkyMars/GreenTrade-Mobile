import { useNavigation, useRoute } from '@react-navigation/native';
import BottomNavigation from 'components/BottomNavigation';
import { useTheme } from 'lib/theme/ThemeContext';
import { useAuth } from 'lib/auth/AuthContext';
import { FetchedListing, Seller } from 'lib/types/main';
import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Animated,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Alert,
    Image
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { getSellerListings } from 'lib/backend/listings/getListings';
import { ListingGridItem, ListingListItem } from 'components/ListingItem';
import { createConversation } from 'lib/backend/chat/createConversation';

export default function SellerScreen() {
    const route = useRoute();
    const params = route.params || {};
    const sellerParam: Seller = params.seller
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('listings');
    const navigation = useNavigation();
    const [sellerListings, setSellerListings] = useState<FetchedListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');
    const [error, setError] = useState<string | null>(null);
    const [averageEcoScore, setAverageEcoScore] = useState(sellerParam.rating);
    const [isListingModalVisible, setIsListingModalVisible] = useState(false);
    const [isCreatingConversation, setIsCreatingConversation] = useState(false);

    // Animation values
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // Device dimensions
    const { width: screenWidth } = Dimensions.get('window');
    const numColumns = 2;
    const columnWidth = (screenWidth - 48) / numColumns; // 48 = padding (16) * 3

    // Calculate average eco score from listings
    const calculateAverageEcoScore = (listings: FetchedListing[]) => {
        if (listings.length === 0) return sellerParam.rating;

        const sum = listings.reduce((total, listing) => total + listing.ecoScore, 0);
        return (sum / listings.length).toFixed(1);
    };

    // Fetch seller listings
    const fetchSellerListings = async (isRefreshing = false) => {
        if (!sellerParam.id) {
            setError('No seller ID provided');
            setLoading(false);
            return;
        }

        if (isRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const listings = await getSellerListings(sellerParam.id);
            setSellerListings(listings);

            // Calculate average eco score
            const avgScore = calculateAverageEcoScore(listings);
            setAverageEcoScore(String(avgScore));

            // Start animations after data loads
            startAnimations();
        } catch (error) {
            console.error('Error fetching seller listings:', error);
            setError('Failed to load seller listings');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Start animations
    const startAnimations = () => {
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
            })
        ]).start();
    };

    // Handle pull-to-refresh
    const onRefresh = () => {
        fetchSellerListings(true);
    };

    // Handle listing press
    const handleListingPress = (id: string) => {
        navigation.navigate('ListingDetail', { id });
    };

    // Handle contact seller
    const handleContactSeller = () => {
        if (!user || !user.id) {
            Alert.alert(
                "Login Required",
                "You need to be logged in to contact the seller.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Login", onPress: () => navigation.navigate('Login' as never) }
                ]
            );
            return;
        }

        // Check if user is trying to contact themselves
        if (user.id === sellerParam.id) {
            Alert.alert("Error", "You cannot contact yourself as a seller");
            return;
        }

        if (sellerListings.length === 0) {
            Alert.alert("No Listings", "This seller doesn't have any listings yet.");
            return;
        }

        // Show the listing selection modal
        setIsListingModalVisible(true);
    };

    // Handle the selection of a listing to start a conversation about
    const handleListingSelect = async (listing: FetchedListing) => {
        try {
            setIsCreatingConversation(true);

            // Create or get conversation
            const conversationId = await createConversation(
                listing.id,
                sellerParam.id,
                user?.id || ""
            );

            // Hide modal
            setIsListingModalVisible(false);
            setIsCreatingConversation(false);

            // Get image URL for the listing
            const imageUrl = Array.isArray(listing.imageUrl)
                ? listing.imageUrl[0]
                : (listing.imageUrl as any).urls && Array.isArray((listing.imageUrl as any).urls)
                    ? (listing.imageUrl as any).urls[0]
                    : 'https://via.placeholder.com/400x300';

            // Navigate to messages screen with conversation ID
            navigation.navigate('Messages', {
                conversationId,
                listingInfo: {
                    id: listing.id,
                    title: listing.title,
                    image: imageUrl,
                }
            });
        } catch (error) {
            console.error('Error creating conversation:', error);
            setIsCreatingConversation(false);
            Alert.alert("Error", "Failed to start conversation. Please try again.");
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchSellerListings();
    }, [sellerParam]);

    // Header elevation effect based on scroll position
    const headerElevation = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const months: string[] = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Animated Header */}
            <Animated.View
                style={{
                    backgroundColor: colors.card,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: headerElevation,
                    shadowRadius: 2,
                    elevation: headerElevation,
                    zIndex: 10,
                    paddingTop: StatusBar.currentHeight,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ marginRight: 12 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                        {sellerParam.name}'s Profile
                    </Text>
                </View>
            </Animated.View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <FontAwesome name="exclamation-circle" size={48} color={colors.error} />
                    <Text style={{
                        fontSize: 18,
                        color: colors.text,
                        marginTop: 16,
                        textAlign: 'center',
                        marginBottom: 24
                    }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: colors.primary,
                            paddingVertical: 10,
                            paddingHorizontal: 20,
                            borderRadius: 8,
                        }}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                >
                    {/* Seller Profile Card */}
                    <Animated.View
                        style={{
                            margin: 16,
                            backgroundColor: colors.card,
                            borderRadius: 12,
                            padding: 16,
                            shadowColor: colors.shadow,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 4,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View
                                style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 35,
                                    backgroundColor: colors.primary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 16,
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 28, fontWeight: '600' }}>
                                    {sellerParam.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
                                        {sellerParam.name}
                                    </Text>
                                    {sellerParam.verified && (
                                        <View
                                            style={{
                                                backgroundColor: colors.primaryLight,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                borderRadius: 12,
                                                marginLeft: 8,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <MaterialCommunityIcons
                                                name="check-decagram"
                                                size={16}
                                                color={colors.primary}
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                                Verified
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <FontAwesome name="leaf" size={16} color={colors.primary} />
                                    <Text style={{ marginLeft: 6, fontSize: 16, color: colors.textSecondary }}>
                                        {averageEcoScore} Eco Score
                                        {sellerListings.length > 0 && (
                                            <Text style={{ fontSize: 14, color: colors.textTertiary }}>
                                                {' '}(avg. of {sellerListings.length} listings)
                                            </Text>
                                        )}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <FontAwesome name="star" size={16} color={colors.rating} />
                                    <Text style={{ marginLeft: 6, fontSize: 16, color: colors.textSecondary }}>
                                        {sellerParam.rating} Rating
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                    <Text style={{ marginLeft: 6, fontSize: 16, color: colors.textSecondary }}>
                                        Active Since {months[new Date(sellerParam.createdAt).getMonth()]}, {new Date(sellerParam.createdAt).getFullYear()}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={{
                                        backgroundColor: colors.primary,
                                        paddingVertical: 8,
                                        paddingHorizontal: 16,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        marginTop: 12,
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                    }}
                                    onPress={handleContactSeller}
                                >
                                    <FontAwesome name="comment" size={16} color="white" style={{ marginRight: 8 }} />
                                    <Text style={{ color: 'white', fontWeight: '600' }}>
                                        Contact Seller
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View
                        style={{
                            margin: 16,
                            backgroundColor: colors.card,
                            borderRadius: 12,
                            padding: 16,
                            shadowColor: colors.shadow,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 4,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                            Bio
                        </Text>
                        <Text style={{ marginTop: 8, fontSize: 16, color: sellerParam.bio ? colors.textSecondary : colors.textTertiary }}>
                            {sellerParam.bio}
                        </Text>
                    </Animated.View>

                    {/* Listings Section */}
                    <Animated.View
                        style={{
                            marginTop: 8,
                            marginHorizontal: 16,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                                Listings ({sellerListings.length})
                            </Text>

                            <View style={{
                                flexDirection: 'row',
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                overflow: 'hidden',
                            }}>
                                <TouchableOpacity
                                    style={{
                                        padding: 8,
                                        backgroundColor: selectedView === 'list' ? colors.highlight : colors.card,
                                    }}
                                    onPress={() => setSelectedView('list')}
                                >
                                    <Feather
                                        name="list"
                                        size={20}
                                        color={selectedView === 'list' ? colors.primary : colors.textTertiary}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        padding: 8,
                                        backgroundColor: selectedView === 'grid' ? colors.highlight : colors.card,
                                    }}
                                    onPress={() => setSelectedView('grid')}
                                >
                                    <Feather
                                        name="grid"
                                        size={20}
                                        color={selectedView === 'grid' ? colors.primary : colors.textTertiary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {sellerListings.length > 0 ? (
                            <FlatList
                                data={sellerListings}
                                renderItem={({ item }) =>
                                    selectedView === 'grid'
                                        ? <ListingGridItem item={item} onPress={handleListingPress} columnWidth={columnWidth} />
                                        : <ListingListItem item={item} onPress={handleListingPress} />
                                }
                                keyExtractor={(item) => item.id.toString()}
                                numColumns={selectedView === 'grid' ? numColumns : 1}
                                key={selectedView === 'grid' ? 'grid' : 'list'}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingBottom: 30 }}
                                columnWrapperStyle={selectedView === 'grid' ? { justifyContent: 'space-between' } : undefined}
                            />
                        ) : (
                            <View style={{
                                backgroundColor: colors.card,
                                padding: 24,
                                borderRadius: 12,
                                alignItems: 'center',
                                marginBottom: 30
                            }}>
                                <MaterialCommunityIcons name="store-off" size={48} color={colors.textTertiary} />
                                <Text style={{
                                    fontSize: 16,
                                    color: colors.text,
                                    textAlign: 'center',
                                    marginTop: 16,
                                    fontWeight: '500'
                                }}>
                                    This seller doesn't have any listings yet
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            )}

            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Listing Selection Modal */}
            <Modal
                visible={isListingModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsListingModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end'
                }}>
                    <View style={{
                        backgroundColor: colors.card,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        maxHeight: '80%'
                    }}>
                        <View style={{
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                                Select a listing to discuss
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsListingModalVisible(false)}
                                disabled={isCreatingConversation}
                            >
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {isCreatingConversation ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={{ marginTop: 16, color: colors.textSecondary }}>
                                    Creating conversation...
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={sellerListings}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            padding: 16,
                                            borderBottomWidth: 1,
                                            borderBottomColor: colors.border,
                                            alignItems: 'center'
                                        }}
                                        onPress={() => handleListingSelect(item)}
                                    >
                                        {/* Listing image */}
                                        <View style={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                            backgroundColor: colors.borderLight
                                        }}>
                                            {item.imageUrl && (
                                                <Image
                                                    source={{
                                                        uri: Array.isArray(item.imageUrl)
                                                            ? item.imageUrl[0]
                                                            : ((item.imageUrl as any).urls && Array.isArray((item.imageUrl as any).urls))
                                                                ? (item.imageUrl as any).urls[0]
                                                                : 'https://via.placeholder.com/400x300'
                                                    }}
                                                    style={{ width: 60, height: 60 }}
                                                />
                                            )}
                                        </View>

                                        {/* Listing details */}
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: colors.text,
                                                marginBottom: 4
                                            }} numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                            <Text style={{ color: colors.primary, fontWeight: '500' }}>
                                                €{item.price}
                                            </Text>
                                        </View>

                                        <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

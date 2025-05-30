import { getListings } from 'lib/backend/listings/getListings';
import { FetchedListing } from 'lib/types/main';
import { useEffect, useState, useRef } from 'react';
import {
	View, Text, ActivityIndicator, SafeAreaView, Image,
	TouchableOpacity, Dimensions, Animated,
	FlatList, Share, Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomNavigation from '../../components/BottomNavigation';
import { formatDistanceToNow } from "date-fns";
import { useTheme } from 'lib/theme/ThemeContext';
import {
	FontAwesome, Feather, MaterialCommunityIcons, Ionicons
} from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { findCategory } from 'lib/functions/category';

export default function ListingDetailScreen() {
	const { colors, isDark } = useTheme();
	const [activeTab, setActiveTab] = useState('listings');
	const navigation = useNavigation();
	const route = useRoute();
	const { id }: { id: number } = route.params;
	const [listing, setListing] = useState<FetchedListing>();
	const [loading, setLoading] = useState(true);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isFavorite, setIsFavorite] = useState(false);

	// Animation references
	const scrollY = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;

	// Device dimensions
	const { width: screenWidth } = Dimensions.get('window');

	// Helper function to get image URLs
	const getImageUrls = (imageUrl: string[] | { urls: string[] }) => {
		if (Array.isArray(imageUrl)) {
			return imageUrl;
		} else if (imageUrl.urls && Array.isArray(imageUrl.urls)) {
			return imageUrl.urls;
		}
		return ['https://via.placeholder.com/400x300'];
	};

	useEffect(() => {
		const fetchListing = async () => {
			try {
				const listing = await getListings(id) as FetchedListing;
				setListing(listing);

				// Animate content in after data loads
				Animated.parallel([
					Animated.timing(fadeAnim, {
						toValue: 1,
						duration: 500,
						useNativeDriver: true,
					}),
					Animated.timing(slideAnim, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					})
				]).start();

			} catch (err) {
				console.error('Failed to fetch listing:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchListing();
	}, [id]);

	if (loading) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			</SafeAreaView>
		);
	}

	if (!listing) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<FontAwesome name="exclamation-circle" size={48} color={colors.error} />
					<Text style={{ fontSize: 18, color: colors.text, marginTop: 16 }}>
						Listing not found
					</Text>
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={{
							marginTop: 20,
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: colors.primary,
							paddingVertical: 10,
							paddingHorizontal: 20,
							borderRadius: 8,
						}}
					>
						<FontAwesome name="arrow-left" size={16} color="white" style={{ marginRight: 8 }} />
						<Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	// Get all images from the listing
	const images = getImageUrls(listing.imageUrl);

	// Get category details
	const category = findCategory(listing.category);

	// Header opacity based on scroll position
	const headerOpacity = scrollY.interpolate({
		inputRange: [0, 200],
		outputRange: [0, 1],
		extrapolate: 'clamp',
	});

	// Image scale effect on scroll
	const imageScale = scrollY.interpolate({
		inputRange: [-100, 0],
		outputRange: [1.2, 1],
		extrapolateRight: 'clamp',
	});

	// Function to share listing
	const handleShare = async () => {
		try {
			await Share.share({
				message: `Check out this ${listing.title} on GreenVue for €${listing.price}! ${Platform.OS === 'ios' ? '' : `https://greenvue.eu/listings/${listing.id}`}`,
				url: `https://greenvue.eu/listings/${listing.id}`,
				title: listing.title,
			});
		} catch (error) {
			console.error('Error sharing listing:', error);
		}
	};

	// Function to toggle favorite
	const toggleFavorite = () => {
		setIsFavorite(!isFavorite);
	};

	// Function to contact seller
	const contactSeller = () => {
		// Implement your contact logic here
		console.log('Contact seller:', listing.seller.id);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<StatusBar style={isDark ? "light" : "dark"} />

			{/* Animated header that appears on scroll */}
			<Animated.View
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: 90,
					paddingTop: 20,
					backgroundColor: colors.card,
					opacity: headerOpacity,
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
				<TouchableOpacity
					onPress={() => navigation.goBack()}
					style={{ padding: 8 }}
				>
					<Ionicons name="arrow-back" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text
					numberOfLines={1}
					style={{
						flex: 1,
						fontSize: 18,
						fontWeight: '600',
						color: colors.text,
						marginLeft: 16,
					}}
				>
					{listing.title}
				</Text>
			</Animated.View>

			<Animated.ScrollView
				showsVerticalScrollIndicator={false}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: true }
				)}
				scrollEventThrottle={16}
				style={{ flex: 1 }}
				contentContainerStyle={{ paddingBottom: 80 }}
			>
				{/* Image gallery */}
				<View style={{ height: 300, position: 'relative' }}>
					<Animated.View style={{
						height: 300,
						transform: [{ scale: imageScale }]
					}}>
						<FlatList
							data={images}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							onMomentumScrollEnd={(e) => {
								const newIndex = Math.round(
									e.nativeEvent.contentOffset.x / screenWidth
								);
								setCurrentImageIndex(newIndex);
							}}
							keyExtractor={(item, index) => `image-${index}`}
							renderItem={({ item }) => (
								<Image
									source={{ uri: item }}
									style={{
										width: screenWidth,
										height: 300,
									}}
									resizeMode="cover"
								/>
							)}
						/>
					</Animated.View>

					{/* Image pagination indicator */}
					{images.length > 1 && (
						<View style={{
							position: 'absolute',
							bottom: 16,
							left: 0,
							right: 0,
							flexDirection: 'row',
							justifyContent: 'center',
							gap: 8,
						}}>
							{images.map((_, index) => (
								<View
									key={`dot-${index}`}
									style={{
										width: index === currentImageIndex ? 20 : 8,
										height: 8,
										borderRadius: 4,
										backgroundColor: index === currentImageIndex
											? colors.primary
											: 'rgba(255, 255, 255, 0.6)',
									}}
								/>
							))}
						</View>
					)}

					{/* Back button */}
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={{
							position: 'absolute',
							top: 24,
							left: 16,
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Ionicons name="arrow-back" size={24} color="white" />
					</TouchableOpacity>

					{/* Share button */}
					<TouchableOpacity
						onPress={handleShare}
						style={{
							position: 'absolute',
							top: 24,
							right: 16,
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Feather name="share" size={20} color="white" />
					</TouchableOpacity>

					{/* Eco score badge */}
					<View
						style={{
							position: 'absolute',
							bottom: 16,
							right: 16,
							backgroundColor: isDark
								? 'rgba(31, 41, 55, 0.8)'
								: 'rgba(255, 255, 255, 0.8)',
							borderRadius: 4,
							paddingHorizontal: 8,
							paddingVertical: 4,
							flexDirection: 'row',
							alignItems: 'center',
						}}
					>
						<FontAwesome name="leaf" size={14} color={colors.primary} />
						<Text
							style={{ marginLeft: 4, fontWeight: '600', color: colors.text }}
						>
							Eco Score: {listing.ecoScore}/5
						</Text>
					</View>
				</View>

				<Animated.View
					style={{
						opacity: fadeAnim,
						transform: [{ translateY: slideAnim }]
					}}
				>
					{/* Title and price section */}
					<View style={{ padding: 16 }}>
						<View style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'flex-start'
						}}>
							<View style={{ flex: 1 }}>
								<Text
									style={{
										fontSize: 24,
										fontWeight: 'bold',
										color: colors.text,
										marginBottom: 8,
									}}
								>
									{listing.title}
								</Text>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text
										style={{
											fontSize: 22,
											fontWeight: '700',
											color: colors.primary,
										}}
									>
										€{listing.price}
									</Text>
									{listing.negotiable && (
										<View style={{
											backgroundColor: colors.primaryLight,
											borderRadius: 4,
											paddingHorizontal: 8,
											paddingVertical: 2,
											marginLeft: 8
										}}>
											<Text style={{
												color: colors.primary,
												fontWeight: '500',
												fontSize: 12
											}}>
												Negotiable
											</Text>
										</View>
									)}
								</View>
							</View>
							<TouchableOpacity
								onPress={toggleFavorite}
								style={{
									width: 40,
									height: 40,
									borderRadius: 20,
									backgroundColor: colors.card,
									alignItems: 'center',
									justifyContent: 'center',
									elevation: 2,
									shadowColor: colors.shadow,
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.2,
									shadowRadius: 2,
								}}
							>
								<FontAwesome
									name={isFavorite ? 'heart' : 'heart-o'}
									size={20}
									color={isFavorite ? colors.error : colors.textSecondary}
								/>
							</TouchableOpacity>
						</View>

						{/* Meta information (location, date, category) */}
						<View style={{ marginTop: 16, gap: 8 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<FontAwesome
									name="map-marker"
									size={16}
									color={colors.textTertiary}
									style={{ marginRight: 8, width: 20 }}
								/>
								<Text style={{ fontSize: 15, color: colors.textSecondary }}>
									{listing.location}
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Feather
									name="clock"
									size={16}
									color={colors.textTertiary}
									style={{ marginRight: 8, width: 20 }}
								/>
								<Text style={{ fontSize: 15, color: colors.textSecondary }}>
									Posted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<FontAwesome
									name={category.icon as any}
									size={16}
									color={colors.primary}
									style={{ marginRight: 8, width: 20 }}
								/>
								<Text style={{ fontSize: 15, color: colors.primary }}>
									{listing.category}
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<MaterialCommunityIcons
									name="tag-outline"
									size={16}
									color={colors.textTertiary}
									style={{ marginRight: 8, width: 20 }}
								/>
								<Text style={{ fontSize: 15, color: colors.textSecondary }}>
									Condition: {listing.condition}
								</Text>
							</View>
						</View>
					</View>

					{/* Divider */}
					<View
						style={{
							height: 1,
							backgroundColor: colors.borderLight,
							marginVertical: 8
						}}
					/>

					{/* Seller info */}
					<View style={{ padding: 16 }}>
						<Text style={{
							fontSize: 18,
							fontWeight: '600',
							color: colors.text,
							marginBottom: 12
						}}>
							Seller
						</Text>

						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: colors.card,
							padding: 12,
							borderRadius: 8,
							borderWidth: 1,
							borderColor: colors.borderLight,
						}}>
							<View style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: colors.primary,
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: 12
							}}>
								<Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
									{listing.seller.name.charAt(0).toUpperCase()}
								</Text>
							</View>

							<View style={{ flex: 1 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={{
										fontSize: 16,
										fontWeight: '600',
										color: colors.text
									}}>
										{listing.seller.name}
									</Text>
									{listing.seller.verified && (
										<View style={{
											backgroundColor: colors.primaryLight,
											borderRadius: 10,
											paddingHorizontal: 6,
											paddingVertical: 2,
											marginLeft: 8,
										}}>
											<Text style={{ color: colors.primary, fontSize: 12 }}>
												Verified ✓
											</Text>
										</View>
									)}
								</View>

								<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
									<FontAwesome name="star" size={14} color={colors.rating} />
									<Text style={{
										marginLeft: 4,
										color: colors.textSecondary,
										fontSize: 14,
									}}>
										{listing.seller.rating} Rating
									</Text>
								</View>
							</View>

							<TouchableOpacity
								style={{
									paddingVertical: 8,
									paddingHorizontal: 12,
									backgroundColor: colors.primary,
									borderRadius: 6,
								}}
								onPress={() => navigation.navigate('SellerDetail', { id: listing.seller.id, seller: listing.seller })}
							>
								<Text style={{ color: 'white', fontWeight: '600' }}>
									Visit Profile
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Divider */}
					<View
						style={{
							height: 1,
							backgroundColor: colors.borderLight,
							marginVertical: 8
						}}
					/>

					{/* Description */}
					<View style={{ padding: 16 }}>
						<Text style={{
							fontSize: 18,
							fontWeight: '600',
							color: colors.text,
							marginBottom: 12
						}}>
							Description
						</Text>

						<Text style={{
							fontSize: 16,
							color: colors.text,
							lineHeight: 24
						}}>
							{listing.description}
						</Text>
					</View>

					{/* Divider */}
					<View
						style={{
							height: 1,
							backgroundColor: colors.borderLight,
							marginVertical: 8
						}}
					/>

					{/* Eco attributes */}
					<View style={{ padding: 16 }}>
						<Text style={{
							fontSize: 18,
							fontWeight: '600',
							color: colors.text,
							marginBottom: 12
						}}>
							Eco Attributes
						</Text>

						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{listing.ecoAttributes.map((attribute, index) => (
								<View
									key={`attr-${index}`}
									style={{
										backgroundColor: colors.primaryLight,
										paddingVertical: 6,
										paddingHorizontal: 12,
										borderRadius: 16,
									}}
								>
									<Text style={{
										color: colors.primaryDark,
										fontWeight: '500',
										fontSize: 14,
									}}>
										{attribute}
									</Text>
								</View>
							))}
						</View>

						<View style={{
							marginTop: 16,
							backgroundColor: colors.card,
							borderRadius: 8,
							padding: 16,
							borderWidth: 1,
							borderColor: colors.borderLight,
						}}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
								<FontAwesome name="leaf" size={18} color={colors.primary} />
								<Text style={{
									marginLeft: 8,
									fontSize: 16,
									fontWeight: '600',
									color: colors.text
								}}>
									Eco Score: {listing.ecoScore}/5
								</Text>
							</View>
							<Text style={{ color: colors.textSecondary }}>
								This item has been verified for its environmental impact. Higher scores indicate more sustainable products.
							</Text>
						</View>
					</View>
				</Animated.View>
			</Animated.ScrollView>

			{/* Contact button */}
			<View style={{
				position: 'absolute',
				bottom: 70, // Leave space for bottom navigation
				left: 0,
				right: 0,
				padding: 16,
				flexDirection: 'row',
				gap: 12,
			}}>
				<TouchableOpacity
					style={{
						flex: 1,
						height: 50,
						backgroundColor: colors.primary,
						borderRadius: 8,
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'row',
					}}
					onPress={contactSeller}
				>
					<FontAwesome name="comment" size={18} color="white" style={{ marginRight: 8 }} />
					<Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
						Contact Seller
					</Text>
				</TouchableOpacity>
			</View>

			<BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
		</SafeAreaView>
	);
}
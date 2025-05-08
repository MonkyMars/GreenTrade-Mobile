import { useEffect, useState, useRef } from 'react'
import { useRoute } from '@react-navigation/native';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	TextInput,
	FlatList,
	useWindowDimensions,
	ActivityIndicator,
	Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import type { RootStackParamList } from './navigation'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../lib/contexts/ThemeContext'
import {
	categories,
	cleanCategory,
} from '../lib/functions/categories'
import { FetchedListing } from 'lib/types/main'
import { getListings } from 'lib/backend/listings/getListings'
import { NativeStackNavigationProp } from '@react-navigation/native-stack/lib/typescript/src/types'
import { ListingGridItem, ListingListItem } from '../components/ListingItem'

type ListingsScreenProps = NativeStackNavigationProp<
	RootStackParamList,
	'Listings'
>

export default function ListingsScreen({ navigation }: ListingsScreenProps) {
	const { width } = useWindowDimensions()
	const route = useRoute();
	const params = route.params || {};
	const category = params.category;
	const { colors } = useTheme()
	const [activeTab, setActiveTab] = useState('listings')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
	const [isFilterOpen, setIsFilterOpen] = useState(false)
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [originalListings, setOriginalListings] = useState<FetchedListing[]>([])
	const [listings, setListings] = useState<FetchedListing[]>([])
	const [loading, setLoading] = useState(false)
	const slideAnim = useRef(new Animated.Value(width)).current

	useEffect(() => {
		if (category) {
			setSelectedCategory(category)
		}
	}, [category])

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
				const response = await getListings("", 50)
				setOriginalListings(response as FetchedListing[])

				// Apply category filter if one is selected
				if (selectedCategory && selectedCategory !== 'all') {
					setListings(
						(response as FetchedListing[]).filter(
							item => cleanCategory(item.category) === cleanCategory(selectedCategory),
						)
					)
				} else {
					setListings(response as FetchedListing[])
				}

			} catch (error) {
				console.error('Error fetching listings:', error)
			} finally {
				setLoading(false)
			}
		}
		fetchListings()
	}, [selectedCategory])

	// Calculate column width for grid view
	const numColumns = 2
	const columnWidth = (width - 48) / numColumns // 48 = padding (16) * 3

	const toggleCategory = (categoryId: string) => {
		setSelectedCategory(categoryId)
		if (categoryId === 'all') {
			setListings(originalListings)
		} else {
			setListings(
				originalListings.filter(
					item => cleanCategory(item.category) === cleanCategory(categoryId),
				),
			)
		}
	}

	// Navigation handler for listings
	const handleListingPress = (id: string) => {
		navigation.navigate('ListingDetail', { id })
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
					backgroundColor: isFilterOpen
						? colors.filterBackground
						: 'transparent',
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
							<Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
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
					renderItem={({ item }) =>
						viewMode === 'grid'
							? <ListingGridItem item={item} onPress={handleListingPress} columnWidth={columnWidth} />
							: <ListingListItem item={item} onPress={handleListingPress} />
					}
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

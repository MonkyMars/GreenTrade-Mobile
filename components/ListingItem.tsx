import { FetchedListing } from 'lib/types/main'
import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { FontAwesome, Feather } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { findCategory } from 'lib/functions/category'
import { useTheme } from 'lib/theme/ThemeContext'

// Helper function to get the first image URL
export const getFirstImageUrl = (imageUrl: string[] | { urls: string[] }) => {
	if (Array.isArray(imageUrl)) {
		return imageUrl[0] || 'https://via.placeholder.com/300x200'
	} else if (imageUrl.urls && Array.isArray(imageUrl.urls)) {
		return imageUrl.urls[0] || 'https://via.placeholder.com/300x200'
	}
	return 'https://via.placeholder.com/300x200'
}

interface ListingItemProps {
	item: FetchedListing
	onPress: (id: string) => void
	columnWidth: number // Only needed for grid view
}

export const ListingGridItem: React.FC<ListingItemProps> = ({
	item,
	onPress,
	columnWidth,
}) => {
	const { colors, isDark } = useTheme()

	return (
		<TouchableOpacity
			onPress={() => onPress(item.id)}
			style={{
				width: columnWidth,
				backgroundColor: colors.card,
				marginBottom: 16,
				borderRadius: 12,
				shadowColor: colors.shadow,
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
				elevation: 2,
				overflow: 'hidden',
			}}
		>
			{/* Flexible image container with aspect ratio handled by resizeMode */}
			<View style={{
				width: '100%',
				height: columnWidth,
				position: 'relative',
				overflow: 'hidden',
			}}>
				<Image
					source={{ uri: getFirstImageUrl(item.imageUrl) }}
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
					numberOfLines={1}
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
						marginBottom: 8,
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

				{/* Location info */}
				<View style={{ marginBottom: 4 }}>
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
					}}>
						<FontAwesome
							name="map-marker"
							size={14}
							color={colors.textTertiary}
							style={{ width: 20, textAlign: 'center' }}
						/>
						<Text
							style={{
								fontSize: 13,
								color: colors.textTertiary,
								marginLeft: 4,
							}}
							numberOfLines={1}
						>
							{item.location}
						</Text>
					</View>
				</View>

				{/* Time info */}
				<View style={{ marginBottom: 8 }}>
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
					}}>
						<Feather
							name="clock"
							size={14}
							color={colors.textTertiary}
							style={{ width: 20, textAlign: 'center' }}
						/>
						<Text
							style={{
								fontSize: 13,
								color: colors.textTertiary,
								marginLeft: 4,
							}}
						>
							{formatDistanceToNow(new Date(item.createdAt), {
								addSuffix: true,
							})}
						</Text>
					</View>
				</View>

				{/* Seller information section - bottom divider */}
				<View
					style={{
						borderTopWidth: 1,
						borderTopColor: colors.border,
						marginBottom: 8,
					}}
				/>

				{/* Seller information section */}
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
						flex: 1
					}}>
						<FontAwesome
							name="user"
							size={14}
							color={colors.textSecondary}
							style={{ width: 20, textAlign: 'center' }}
						/>
						<Text
							style={{
								fontSize: 13,
								fontWeight: '500',
								color: colors.textSecondary,
								marginLeft: 4,
							}}
							numberOfLines={1}
						>
							{item.sellerUsername}
						</Text>
						{item.sellerVerified && (
							<FontAwesome
								name="check-circle"
								size={14}
								color={colors.primary}
								style={{ marginLeft: 4 }}
							/>
						)}
					</View>

					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
						marginLeft: 8,
					}}>
						<FontAwesome
							name="star"
							size={14}
							color="#FFD700"
							style={{ marginRight: 4 }}
						/>
						<Text
							style={{
								fontSize: 13,
								color: colors.textSecondary,
							}}
						>
							{item.sellerRating.toFixed(1)}
						</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	)
}

export const ListingListItem: React.FC<ListingItemProps> = ({
	item,
	onPress,
}) => {
	const { colors } = useTheme()
	const category = findCategory(item.category)

	// Fixed width with flexible height for the image
	const imageWidth = 140

	return (
		<TouchableOpacity
			onPress={() => onPress(item.id)}
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
			}}
		>
			<View style={{ flexDirection: 'row' }}>
				{/* Flexible image container with dynamic aspect ratio */}
				<View style={{
					width: imageWidth,
					aspectRatio: 1,
					overflow: 'hidden'
				}}>
					<Image
						source={{ uri: getFirstImageUrl(item.imageUrl) }}
						style={{ width: '100%', height: '100%' }}
						resizeMode="cover"
					/>
				</View>
				<View style={{ flex: 1, padding: 12 }}>
					<Text
						numberOfLines={1}
						style={{
							fontSize: 16,
							fontWeight: '500',
							color: colors.text,
							marginBottom: 6,
						}}
					>
						{item.title}
					</Text>
					<Text
						style={{
							color: colors.primary,
							fontSize: 16,
							fontWeight: '700',
							marginBottom: 8,
						}}
					>
						€{item.price}
					</Text>

					{/* Location and Time info */}
					<View style={{ marginBottom: 8 }}>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							marginBottom: 4
						}}>
							<FontAwesome
								name="map-marker"
								size={14}
								color={colors.textTertiary}
								style={{ width: 20, textAlign: 'center' }}
							/>
							<Text
								style={{
									fontSize: 13,
									color: colors.textTertiary,
									marginLeft: 4,
								}}
							>
								{item.location}
							</Text>
						</View>

						<View style={{
							flexDirection: 'row',
							alignItems: 'center'
						}}>
							<Feather
								name="clock"
								size={14}
								color={colors.textTertiary}
								style={{ width: 20, textAlign: 'center' }}
							/>
							<Text
								style={{
									fontSize: 13,
									color: colors.textTertiary,
									marginLeft: 4,
								}}
							>
								{formatDistanceToNow(new Date(item.createdAt), {
									addSuffix: true,
								})}
							</Text>
						</View>
					</View>

					{/* Category info */}
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: 8
					}}>
						<FontAwesome
							name={category.icon as any}
							size={14}
							color={colors.primary}
							style={{ width: 20, textAlign: 'center' }}
						/>
						<Text
							style={{
								fontSize: 13,
								fontWeight: '500',
								color: colors.primary,
								marginLeft: 4,
							}}
						>
							{category.name}
						</Text>
					</View>

					{/* Divider */}
					<View
						style={{
							borderTopWidth: 1,
							borderTopColor: colors.border,
							marginBottom: 8,
						}}
					/>

					{/* Seller information section */}
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							flex: 1,
						}}>
							<FontAwesome
								name="user"
								size={14}
								color={colors.textSecondary}
								style={{ width: 20, textAlign: 'center' }}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: '500',
									color: colors.textSecondary,
									marginLeft: 4,
								}}
								numberOfLines={1}
							>
								{item.sellerUsername}
							</Text>
							{item.sellerVerified && (
								<FontAwesome
									name="check-circle"
									size={14}
									color={colors.primary}
									style={{ marginLeft: 4 }}
								/>
							)}
						</View>

						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							marginLeft: 8,
						}}>
							<FontAwesome
								name="star"
								size={14}
								color="#FFD700"
								style={{ marginRight: 4 }}
							/>
							<Text
								style={{
									fontSize: 13,
									color: colors.textSecondary,
								}}
							>
								{item.sellerRating.toFixed(1)}
							</Text>
						</View>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	)
}

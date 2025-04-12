import { FetchedListing } from 'lib/types/main';
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { findCategory } from 'lib/functions/category';
import { useTheme } from 'lib/theme/ThemeContext';

// Helper function to get the first image URL
export const getFirstImageUrl = (imageUrl: string[] | { urls: string[] }) => {
    if (Array.isArray(imageUrl)) {
        return imageUrl[0] || 'https://via.placeholder.com/300x200';
    } else if (imageUrl.urls && Array.isArray(imageUrl.urls)) {
        return imageUrl.urls[0] || 'https://via.placeholder.com/300x200';
    }
    return 'https://via.placeholder.com/300x200';
};

interface ListingItemProps {
    item: FetchedListing;
    onPress: (id: string) => void;
    columnWidth?: number; // Only needed for grid view
}

export const ListingGridItem: React.FC<ListingItemProps> = ({ item, onPress, columnWidth }) => {
    const { colors, isDark } = useTheme();
    const category = findCategory(item.category);

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
            <View style={{ height: 150, position: 'relative' }}>
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
                </View>

                <View style={{ marginVertical: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="clock" size={14} color={colors.textTertiary} />
                        <Text
                            style={{
                                fontSize: 12,
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
            </View>
        </TouchableOpacity>
    );
};

export const ListingListItem: React.FC<ListingItemProps> = ({ item, onPress }) => {
    const { colors } = useTheme();
    const category = findCategory(item.category);

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
                <Image
                    source={{ uri: getFirstImageUrl(item.imageUrl) }}
                    style={{ width: 120, height: 120, marginRight: 8 }}
                    resizeMode="cover"
                />
                <View style={{ flex: 1, marginLeft: 8, paddingVertical: 8 }}>
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
                        {item.location} •{' '}
                        {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                        })}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome
                            name={category.icon as any}
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
            </View>
        </TouchableOpacity>
    );
};
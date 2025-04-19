import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Conversation } from 'lib/types/chat';
import { useNavigation } from '@react-navigation/native';

interface ChatHeaderProps {
    conversation: Conversation | undefined;
    userId: string | undefined;
    onBackPress: () => void;
    colors: any;
}

/**
 * Header component for the chat detail view
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, userId, onBackPress, colors }) => {
    const navigation = useNavigation();

    const isBuyer = (convo: Conversation) => {
        return convo?.buyerId === userId;
    };

    if (!conversation) return null;

    const participantName = isBuyer(conversation)
        ? conversation.sellerName
        : conversation.buyerName;

    const participantId = isBuyer(conversation)
        ? conversation.sellerId
        : conversation.buyerId;

    const navigateToUserProfile = () => {
        navigation.navigate("SellerDetail", { id: participantId } as never);
    };

    return (
        <View style={{
            backgroundColor: colors.card,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            flexDirection: 'row',
            alignItems: 'center',
        }}>
            <TouchableOpacity
                onPress={onBackPress}
                style={{ marginRight: 12 }}
            >
                <Feather name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* User Avatar */}
            <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                position: 'relative'
            }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                    {(participantName || "?").charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                        style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 6 }}
                        onPress={navigateToUserProfile}
                    >
                        {participantName || "User"}
                    </Text>
                </View>

                <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                    {conversation.listingName && (
                        `About: ${conversation.listingName}`
                    )}
                </Text>
            </View>

            <TouchableOpacity style={{ marginLeft: 8, padding: 8 }}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
};

export default ChatHeader;
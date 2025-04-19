import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Conversation } from 'lib/types/chat';
import { formatTime } from 'lib/utils/date/chatDateUtils';

interface ConversationItemProps {
    item: Conversation;
    userId: string | undefined;
    onPress: () => void;
    colors: any;
}

/**
 * Component to render a single conversation in the list
 */
const ConversationItem: React.FC<ConversationItemProps> = ({ item, userId, onPress, colors }) => {
    const isBuyer = (conversation: Conversation) => {
        return conversation.buyerId === userId;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.card,
            }}
        >
            <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                position: 'relative'
            }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                    {(isBuyer(item) ? item.sellerName : item.buyerName || "?").charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{
                        fontSize: 16,
                        color: colors.text,
                        marginRight: 6
                    }}>
                        {isBuyer(item) ? item.sellerName : item.buyerName || "User"}
                    </Text>
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 14,
                        color: colors.textTertiary,
                    }}
                >
                    {item.lastMessage ? item.lastMessage.text : "Start a conversation about " + (item.listingName || "this listing")}
                </Text>
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 50 }}>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>
                    {item.lastMessage ? formatTime(item.lastMessage.timestamp as Date) : ''}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default ConversationItem;
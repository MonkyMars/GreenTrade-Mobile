import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Conversation } from 'lib/types/chat';
import ConversationItem from './ConversationItem';
import EmptyMessages from "./EmptyMessages";

interface ConversationListProps {
    conversations: Conversation[];
    loading: boolean;
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onConversationPress: (id: string) => void;
    userId: string | undefined;
    colors: any;
    refreshing?: boolean;
    onRefresh?: () => void;
}

/**
 * Component to display the list of conversations
 */
const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    loading,
    searchQuery,
    onSearchChange,
    onConversationPress,
    userId,
    colors,
    refreshing = false,
    onRefresh
}) => {
    // Filter conversations based on search query
    const filteredConversations = conversations.filter(conversation =>
        (conversation.buyerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conversation.lastMessage ? conversation.lastMessage.text : conversation.sellerName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.card,
                padding: 16,
                paddingTop: 56, // Adjust for status bar
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
            }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
                    Messages
                </Text>
                <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 4 }}>
                    Connect with eco-conscious buyers and sellers
                </Text>
            </View>

            {/* Search Input */}
            <View style={{ padding: 16 }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                }}>
                    <Feather name="search" size={20} color={colors.textTertiary} />
                    <TextInput
                        placeholder="Search messages..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        style={{
                            flex: 1,
                            marginLeft: 8,
                            color: colors.text,
                            fontSize: 15,
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => onSearchChange('')}>
                            <Feather name="x" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Chat Threads List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading conversations...</Text>
                </View>
            ) : conversations.length > 0 ? (
                <FlatList
                    data={filteredConversations}
                    renderItem={({ item }) => (
                        <ConversationItem
                            item={item}
                            userId={userId}
                            onPress={() => onConversationPress(item.id)}
                            colors={colors}
                        />
                    )}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{
                        paddingBottom: 100, // extra padding for bottom nav
                    }}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                            />
                        ) : undefined
                    }
                    ListEmptyComponent={
                        searchQuery.length > 0 ? (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                    No messages found matching "{searchQuery}"
                                </Text>
                            </View>
                        ) : null
                    }
                />
            ) : (
                <EmptyMessages colors={colors} />
            )}
        </View>
    );
};

export default ConversationList;
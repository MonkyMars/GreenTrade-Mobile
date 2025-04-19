import React, { useRef, useEffect } from 'react';
import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { ChatMessage, Conversation } from 'lib/types/chat';
import MessageItem from './MessageItem';
import { formatDateForDivider } from 'lib/utils/date/chatDateUtils';

interface MessageListProps {
    messages: ChatMessage[];
    loading: boolean;
    conversation: Conversation | undefined;
    userId: string | undefined;
    colors: any;
}

/**
 * Component to display the list of messages with date dividers
 */
const MessageList: React.FC<MessageListProps> = ({
    messages,
    loading,
    conversation,
    userId,
    colors
}) => {
    const listRef = useRef<FlatList>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (listRef.current && messages.length > 0) {
            setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // Process messages to include date dividers
    const processMessagesWithDateDividers = (messages: ChatMessage[]) => {
        if (!messages.length) return [];

        const result: (ChatMessage | { id: string, isDateDivider: true, date: string })[] = [];
        let currentDate: string | null = null;

        messages.forEach(message => {
            const messageDate = new Date(message.timestamp);
            const dateString = messageDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            if (dateString !== currentDate) {
                currentDate = dateString;
                result.push({
                    id: `divider-${dateString}`,
                    isDateDivider: true,
                    date: formatDateForDivider(messageDate)
                });
            }

            result.push(message);
        });

        return result;
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading messages...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                ref={listRef}
                data={processMessagesWithDateDividers(messages)}
                renderItem={({ item }) => (
                    <MessageItem
                        item={item}
                        conversation={conversation}
                        userId={userId}
                        colors={colors}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingVertical: 16,
                    justifyContent: messages.length === 0 ? 'center' : undefined,
                }}
                ListEmptyComponent={
                    <View style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                            No messages yet. Start the conversation!
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

export default MessageList;
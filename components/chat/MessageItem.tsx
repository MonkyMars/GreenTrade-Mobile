import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { ChatMessage, Conversation } from 'lib/types/chat';
import { safeParseDate, addToCalendar } from 'lib/utils/date/chatDateUtils';

interface MessageItemProps {
    item: ChatMessage | { id: string, isDateDivider: true, date: string };
    conversation: Conversation | undefined;
    userId: string | undefined;
    colors: any;
}

/**
 * Component to render a chat message or date divider
 */
const MessageItem: React.FC<MessageItemProps> = ({ item, conversation, userId, colors }) => {
    // If this is a date divider, render the date header
    if ('isDateDivider' in item) {
        return (
            <View style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                marginVertical: 8
            }}>
                <View style={{
                    backgroundColor: colors.primaryLight,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                }}>
                    <Text style={{
                        color: colors.primary,
                        fontSize: 13,
                        fontWeight: '500'
                    }}>
                        {item.date}
                    </Text>
                </View>
            </View>
        );
    }

    // Check if this is a date message (which would be in JSON format)
    let isDateMessage = false;
    let dateData: any = null;

    try {
        if (item.text.startsWith('{"text":"📅')) {
            const parsedMessage = JSON.parse(item.text);
            if (parsedMessage.type === 'date') {
                isDateMessage = true;
                dateData = parsedMessage;
            }
        }
    } catch (e) {
        // Not a valid JSON message, treat as regular message
    }

    // Otherwise render a normal message or date message
    const isUserMessage = item.senderId === userId;

    const isBuyer = (convo: Conversation) => {
        return convo.buyerId === userId;
    };

    return (
        <View style={{
            flexDirection: 'row',
            justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
            marginBottom: 12,
            paddingHorizontal: 16
        }}>
            {!isUserMessage && (
                <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primaryLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                    alignSelf: 'flex-end'
                }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                        {(conversation && (isBuyer(conversation) ? conversation.sellerName : conversation.buyerName) || "?").charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}

            <View style={{
                maxWidth: '70%',
                backgroundColor: isUserMessage ? colors.primary : colors.card,
                borderRadius: 20,
                padding: 12,
                borderBottomLeftRadius: isUserMessage ? 20 : 4,
                borderBottomRightRadius: isUserMessage ? 4 : 20,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
            }}>
                {isDateMessage ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (dateData && dateData.timestamp) {
                                addToCalendar(dateData.timestamp);
                            }
                        }}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{
                            color: isUserMessage ? 'white' : colors.text,
                            fontSize: 15,
                        }}>
                            {dateData.text}
                        </Text>
                        <View style={{ marginLeft: 8 }}>
                            <AntDesign
                                name="calendar"
                                size={16}
                                color={isUserMessage ? 'white' : colors.primary}
                            />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <Text style={{
                        color: isUserMessage ? 'white' : colors.text,
                        fontSize: 15,
                    }}>
                        {item.text}
                    </Text>
                )}

                <Text style={{
                    fontSize: 11,
                    color: isUserMessage ? 'rgba(255, 255, 255, 0.7)' : colors.textTertiary,
                    marginTop: 4,
                    textAlign: isUserMessage ? 'right' : 'left'
                }}>
                    {typeof item.timestamp === 'string'
                        ? safeParseDate(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : safeParseDate(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                </Text>
            </View>
        </View>
    );
};

export default MessageItem;
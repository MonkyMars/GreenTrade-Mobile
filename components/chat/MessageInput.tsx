import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Text
} from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import CustomDatePicker from '../CustomDatePicker';

interface MessageInputProps {
    onSendMessage: (text: string) => Promise<void>;
    onSendDateTime: (date: Date) => Promise<void>;
    sending: boolean;
    colors: any;
}

/**
 * Component for the message input area with plus menu and date picker
 */
const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    onSendDateTime,
    sending,
    colors
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        await onSendMessage(newMessage.trim());
        setNewMessage('');
    };

    const handleDateTimeSelected = async (date: Date) => {
        setSelectedDate(date);
        await onSendDateTime(date);
        setShowDatePicker(false);
        setShowPlusMenu(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: colors.card,
                borderTopWidth: 1,
                borderTopColor: colors.border,
            }}>
                <TouchableOpacity
                    style={{ padding: 8, marginRight: 8 }}
                    onPress={() => setShowPlusMenu(!showPlusMenu)}
                >
                    <Feather name="plus-circle" size={24} color={colors.primary} />
                </TouchableOpacity>

                <View style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: Platform.OS === 'ios' ? 10 : 2,
                    minHeight: 40,
                }}>
                    <TextInput
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textTertiary}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        style={{
                            color: colors.text,
                            fontSize: 15,
                            maxHeight: 100,
                        }}
                    />
                </View>

                <TouchableOpacity
                    style={{
                        padding: 8,
                        marginLeft: 8,
                        opacity: (newMessage.trim().length > 0 && !sending) ? 1 : 0.5
                    }}
                    onPress={handleSendMessage}
                    disabled={newMessage.trim().length === 0 || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Feather name="send" size={24} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Plus Menu */}
            {showPlusMenu && (
                <View style={{
                    backgroundColor: colors.card,
                    padding: 16,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-start',
                    }}>
                        {/* Date/Time Tile */}
                        <TouchableOpacity
                            style={{
                                width: '16.66%', // 6 tiles per row
                                aspectRatio: 1,
                                padding: 4,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onPress={() => {
                                setShowDatePicker(true);
                            }}
                        >
                            <View style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: colors.primaryLight,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <AntDesign name="calendar" size={24} color={colors.primary} />
                            </View>
                            <Text style={{
                                fontSize: 12,
                                color: colors.text,
                                marginTop: 4,
                                textAlign: 'center',
                            }}>
                                Date
                            </Text>
                        </TouchableOpacity>

                        {/* Placeholder for 5 more tiles */}
                        {/* Placeholder for 5 more tiles */}
                        {Array(5).fill(0).map((_, index) => (
                            <View key={index} style={{
                                width: '16.66%',
                                aspectRatio: 1,
                                padding: 4,
                            }} />
                        ))}
                    </View>
                </View>
            )}

            {/* Date Picker Modal */}
            <CustomDatePicker
                isVisible={showDatePicker}
                colors={colors}
                onConfirm={handleDateTimeSelected}
                onClose={() => setShowDatePicker(false)}
                selectedDate={selectedDate}
            />
        </KeyboardAvoidingView>
    );
};

export default MessageInput;
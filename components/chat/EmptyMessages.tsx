import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface EmptyMessagesProps {
    colors: any;
}

/**
 * Component to display when there are no messages
 */
const EmptyMessages: React.FC<EmptyMessagesProps> = ({ colors }) => {
    const navigation = useNavigation();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 80, paddingTop: 32 }}>
            <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
            }}>
                <FontAwesome name="comments" size={36} color={colors.primary} />
            </View>

            <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 8
            }}>
                No messages yet
            </Text>

            <Text style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: 24
            }}>
                Start a conversation by messaging a seller about their eco-friendly items
            </Text>

            <TouchableOpacity
                style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
                onPress={() => navigation.navigate('Listings' as never)}
            >
                <Feather name="search" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600' }}>Browse Listings</Text>
            </TouchableOpacity>
        </View>
    );
};

export default EmptyMessages;
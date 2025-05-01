import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'

interface SecurityTabProps {
    colors: any
}

export default function SecurityTab({ colors }: SecurityTabProps) {
    return (
        <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <FontAwesome name="shield" size={18} color={colors.primary} />
                <Text style={{
                    marginLeft: 10,
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.text
                }}>
                    Security Settings
                </Text>
            </View>

            <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 16
            }}>
                Change Password
            </Text>

            <View style={{ marginBottom: 16 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: 6
                }}>
                    Current Password
                </Text>
                <TextInput
                    secureTextEntry
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                        backgroundColor: colors.background,
                    }}
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            <View style={{ marginBottom: 16 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: 6
                }}>
                    New Password
                </Text>
                <TextInput
                    secureTextEntry
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                        backgroundColor: colors.background,
                    }}
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            <View style={{ marginBottom: 24 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: 6
                }}>
                    Confirm New Password
                </Text>
                <TextInput
                    secureTextEntry
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                        backgroundColor: colors.background,
                    }}
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            <TouchableOpacity
                style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 6,
                    alignItems: 'center',
                    marginBottom: 24
                }}
            >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                    Change Password
                </Text>
            </TouchableOpacity>

            <View style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 24,
                marginBottom: 8
            }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8
                }}>
                    Login Sessions
                </Text>

                <Text style={{
                    color: colors.textSecondary,
                    marginBottom: 16
                }}>
                    Manage your active login sessions. If you notice any suspicious activity,
                    log out of all devices immediately.
                </Text>

                <TouchableOpacity
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        paddingVertical: 12,
                        alignItems: 'center',
                        backgroundColor: colors.background,
                    }}
                >
                    <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
                        Log out of all devices
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
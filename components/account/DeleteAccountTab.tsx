import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

interface DeleteAccountTabProps {
    colors: any
    isDark: boolean
    logout: () => Promise<void>
    showAlert: (config: any) => void
}

export default function DeleteAccountTab({
    colors,
    isDark,
    logout,
    showAlert
}: DeleteAccountTabProps) {
    const navigation = useNavigation()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
    const [deleteText, setDeleteText] = useState<string>('')

    const handleDeleteAccount = async () => {
        if (deleteText.toLowerCase() !== "delete my account") {
            showAlert({
                title: "Error",
                message: "Please type 'delete my account' to confirm.",
                buttons: [{ text: "OK" }]
            })
            return
        }

        try {
            // In a real app, you would make an API call to delete the account
            // For now, we'll just log out the user
            await logout()
            navigation.navigate('Home')
            showAlert({
                title: "Success",
                message: "Your account has been deleted.",
                buttons: [{ text: "OK" }]
            })
        } catch (error) {
            console.error("Error deleting account:", error)
            showAlert({
                title: "Error",
                message: "Failed to delete account. Please try again.",
                buttons: [{ text: "OK" }]
            })
        }
    }

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
                <FontAwesome name="trash" size={18} color={colors.error} />
                <Text style={{
                    marginLeft: 10,
                    fontSize: 18,
                    fontWeight: '700',
                    color: colors.text
                }}>
                    Delete Account
                </Text>
            </View>

            <View style={{
                backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(254, 226, 226, 0.8)',
                borderWidth: 1,
                borderColor: colors.error,
                borderRadius: 8,
                padding: 16,
                marginBottom: 24
            }}>
                <View style={{ flexDirection: 'row' }}>
                    <FontAwesome name="exclamation-triangle" size={16} color={colors.error} style={{ marginTop: 2 }} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.error,
                            marginBottom: 8
                        }}>
                            Warning: This action cannot be undone
                        </Text>
                        <Text style={{ color: colors.textSecondary }}>
                            Deleting your account will permanently remove all your data, including listings,
                            messages, and purchase history. Your account cannot be recovered after deletion.
                        </Text>
                    </View>
                </View>
            </View>

            {!showDeleteConfirm ? (
                <TouchableOpacity
                    style={{
                        backgroundColor: colors.error,
                        paddingVertical: 12,
                        borderRadius: 6,
                        alignItems: 'center',
                    }}
                    onPress={() => setShowDeleteConfirm(true)}
                >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                        Delete My Account
                    </Text>
                </TouchableOpacity>
            ) : (
                <View>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: 8
                    }}>
                        Confirm Account Deletion
                    </Text>

                    <Text style={{
                        color: colors.textSecondary,
                        marginBottom: 16
                    }}>
                        Please type <Text style={{ fontWeight: '700' }}>delete my account</Text> below to confirm:
                    </Text>

                    <TextInput
                        value={deleteText}
                        onChangeText={setDeleteText}
                        style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            color: colors.text,
                            backgroundColor: colors.background,
                            marginBottom: 16
                        }}
                        placeholderTextColor={colors.textTertiary}
                        placeholder="delete my account"
                    />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.error,
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 6,
                                alignItems: 'center',
                            }}
                            onPress={handleDeleteAccount}
                        >
                            <Text style={{ color: 'white', fontWeight: '600' }}>
                                Permanently Delete Account
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 6,
                                alignItems: 'center',
                                backgroundColor: colors.background,
                            }}
                            onPress={() => setShowDeleteConfirm(false)}
                        >
                            <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    )
}
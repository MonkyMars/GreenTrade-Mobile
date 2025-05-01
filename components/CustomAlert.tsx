import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';
import { useTheme } from 'lib/theme/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }[];
    type?: 'success' | 'error' | 'warning' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    buttons = [{ text: 'OK', onPress: () => { }, style: 'default' }],
    type = 'info',
}) => {
    const { colors, isDark } = useTheme();
    const opacity = React.useRef(new Animated.Value(0)).current;
    const scale = React.useRef(new Animated.Value(0.9)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            scale.setValue(0.9);
        }
    }, [visible, opacity, scale]);

    const getIconName = () => {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'exclamation-circle';
            case 'warning':
                return 'exclamation-triangle';
            case 'info':
            default:
                return 'info-circle';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success':
                return colors.primary;
            case 'error':
                return colors.error;
            case 'warning':
                return '#FFC107'; // Amber color for warnings
            case 'info':
            default:
                return colors.primary;
        }
    };

    const getTypeBackgroundColor = () => {
        // Create subtle background colors based on type
        switch (type) {
            case 'success':
                return isDark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(209, 250, 229, 0.6)';
            case 'error':
                return isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 226, 226, 0.6)';
            case 'warning':
                return isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 237, 213, 0.6)';
            case 'info':
            default:
                return isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(219, 234, 254, 0.6)';
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={() => {
                const cancelButton = buttons.find(
                    (button) => button.style === 'cancel'
                );
                if (cancelButton) {
                    cancelButton.onPress();
                } else if (buttons.length > 0) {
                    buttons[buttons.length - 1].onPress();
                }
            }}
        >
            <View style={styles.centeredView}>
                <Animated.View
                    style={[
                        styles.modalView,
                        {
                            backgroundColor: colors.card,
                            opacity,
                            transform: [{ scale }],
                            shadowColor: colors.shadow,
                        },
                    ]}
                >
                    <View style={[
                        styles.iconContainer,
                        {
                            backgroundColor: getTypeBackgroundColor(),
                            borderColor: type === 'warning' ? '#FFC107' :
                                type === 'error' ? colors.error :
                                    type === 'success' ? colors.primary : colors.primary,
                        }
                    ]}>
                        <FontAwesome
                            name={getIconName()}
                            size={34}
                            color={getIconColor()}
                        />
                    </View>

                    <Text
                        style={[
                            styles.title,
                            {
                                color: colors.text,
                            },
                        ]}
                    >
                        {title}
                    </Text>

                    <Text
                        style={[
                            styles.message,
                            {
                                color: colors.textSecondary,
                            },
                        ]}
                    >
                        {message}
                    </Text>

                    <View
                        style={[
                            styles.buttonContainer,
                            buttons.length > 2 && styles.buttonContainerVertical,
                        ]}
                    >
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    buttons.length > 2 ? styles.fullWidthButton : {},
                                    buttons.length === 2 && index === 0 && styles.buttonLeft,
                                    buttons.length === 2 && index === 1 && styles.buttonRight,
                                    button.style === 'destructive' && {
                                        backgroundColor: colors.error,
                                    },
                                    button.style === 'cancel' && {
                                        backgroundColor: isDark
                                            ? 'rgba(55, 65, 81, 0.15)'
                                            : 'rgba(243, 244, 246, 0.5)',
                                        borderWidth: 1,
                                        borderColor: colors.primary
                                    },
                                    button.style === 'default' && {
                                        backgroundColor: colors.primary,
                                        borderColor: colors.primary
                                    },
                                ]}
                                onPress={button.onPress}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        {
                                            color:
                                                button.style === 'cancel'
                                                    ? colors.textSecondary
                                                    : 'white',
                                        },
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 16,
    },
    modalView: {
        width: width * 0.85,
        maxWidth: 400,
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 14,
    },
    message: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 28,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 16,
    },
    buttonContainerVertical: {
        flexDirection: 'column',
    },
    button: {
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    fullWidthButton: {
        width: '100%',
        marginVertical: 6,
    },
    buttonLeft: {
        flex: 1,
        marginRight: 8,
    },
    buttonRight: {
        flex: 1,
        marginLeft: 8,
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
    },
});

export default CustomAlert;
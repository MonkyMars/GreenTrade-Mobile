import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
    Keyboard,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from 'lib/theme/ThemeContext';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from 'lib/auth/AuthContext';
import api from 'lib/backend/api/axiosConfig';
import CustomAlert from 'components/CustomAlert';
import { z } from 'zod';
import { Review } from 'lib/types/main';
import { toSnakeCase } from 'lib/functions/snakeCase';

// Define the Zod schema for review form validation
const reviewSchema = z.object({
    rating: z.number()
        .min(1, "Please select a rating")
        .max(5, "Maximum rating is 5 stars"),
    title: z.string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be less than 100 characters"),
    comment: z.string()
        .trim()
        .min(5, "Review must be at least 5 characters")
        .max(1000, "Review must be less than 1000 characters")
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface AlertConfig {
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    buttons: Array<{
        text: string;
        style?: 'default' | 'cancel' | 'destructive';
        onPress: () => void;
    }>;
}

export default function ReviewsScreen() {
    const { isAuthenticated } = useAuth();
    const navigation = useNavigation();
    const route = useRoute();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const { sellerId } = route.params as { sellerId: string };

    const [sellerName, setSellerName] = useState<string>("");
    const [formData, setFormData] = useState<ReviewFormData>({
        rating: 0,
        title: '',
        comment: ''
    });
    const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormData, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showAlert, isVisible, config, hideAlert } = useCustomAlert();

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const buttonOpacity = useRef(new Animated.Value(0.5)).current;
    const ratingScale = useRef(Array(5).fill(0).map(() => new Animated.Value(1))).current;

    useEffect(() => {
        const isUser = user?.id === sellerId;
        if (isUser) {
            showAlert({
                title: "Error",
                message: "You cannot review your own profile.",
                type: "error",
                buttons: [{ text: "OK", onPress: hideAlert }]
            });
            navigation.goBack();
        }
    }, [user, sellerId, showAlert, hideAlert, navigation]);

    // Fetch seller data
    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/seller/${sellerId}`);

                if (response.data && response.data.success) {
                    setSellerName(response.data.data.username || response.data.data.name || "Seller");
                }
            } catch (error) {
                console.error('Error fetching seller data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, [sellerId]);

    // Start animations
    useEffect(() => {
        if (!loading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [loading]);

    // Update button opacity based on form validity
    useEffect(() => {
        const isFormValid = formData.rating > 0 &&
            formData.title.trim().length > 0 &&
            formData.comment.trim().length > 0;

        Animated.timing(buttonOpacity, {
            toValue: isFormValid ? 1 : 0.5,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [formData]);

    // Handle field changes
    const handleChange = (name: keyof ReviewFormData, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear corresponding error if exists
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Handle rating selection
    const handleRatingSelect = (rating: number) => {
        // Reset all animations
        ratingScale.forEach((anim) => {
            Animated.spring(anim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }).start();
        });

        // Animate the selected star
        Animated.sequence([
            Animated.spring(ratingScale[rating - 1], {
                toValue: 1.3,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(ratingScale[rating - 1], {
                toValue: 1.1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();

        handleChange('rating', rating);
    };

    // Validate form using Zod
    const validateForm = (): boolean => {
        try {
            reviewSchema.parse(formData);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof ReviewFormData, string>> = {};
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof ReviewFormData] = err.message;
                    }
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        Keyboard.dismiss();

        if (!validateForm()) {
            return;
        }

        if (!isAuthenticated || !user) {
            showAlert({
                title: "Login Required",
                message: "You need to be logged in to leave a review",
                type: "info",
                buttons: [
                    { text: "Cancel", style: "cancel", onPress: hideAlert },
                    {
                        text: "Login",
                        style: "default",
                        onPress: () => {
                            hideAlert();
                            navigation.navigate('Login' as never);
                        }
                    }
                ]
            });
            return;
        }

        try {
            setSubmitting(true);
            if (!isAuthenticated) return;

            const reviewData: Review = {
                sellerId: sellerId,
                userId: user.id,
                rating: formData.rating,
                title: formData.title,
                content: formData.comment,
                helpfulCount: 0,
                verifiedPurchase: false,
            };

            const payload = toSnakeCase(reviewData);

            const response = await api.post('/api/reviews', payload)

            if (!response.data || !response.data.success) {
                throw new Error('Failed to submit review');
            }

            showAlert({
                title: "Review Submitted",
                message: "Thank you for sharing your feedback!",
                type: "success",
                buttons: [{
                    text: "OK",
                    onPress: () => {
                        hideAlert();
                        navigation.goBack();
                    }
                }]
            });
        } catch (error) {
            console.error('Error submitting review:', error);
            showAlert({
                title: "Error",
                message: "Failed to submit review. Please try again.",
                type: "error",
                buttons: [{ text: "OK", onPress: hideAlert }]
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <StatusBar
                    backgroundColor={colors.card}
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                />
                <View
                    style={{
                        backgroundColor: colors.card,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 3,
                        zIndex: 10,
                        paddingTop: StatusBar.currentHeight,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ marginRight: 12 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                            Write a Review
                        </Text>
                    </View>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 16, color: colors.textSecondary }}>
                        Loading...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar
                backgroundColor={colors.card}
                barStyle={isDark ? 'light-content' : 'dark-content'}
            />

            {/* Header */}
            <View
                style={{
                    backgroundColor: colors.card,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 3,
                    zIndex: 10,
                    paddingTop: StatusBar.currentHeight,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ marginRight: 12 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                        Write a Review
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Seller Info */}
                <Animated.View
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                        You're reviewing
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                                {sellerName.charAt(0).toUpperCase()}
                            </Text>
                        </View>

                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                                {sellerName}
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.textTertiary }}>
                                Seller
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Rating */}
                <Animated.View
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
                        Rating <Text style={{ color: colors.error }}>*</Text>
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <Animated.View key={star} style={{ transform: [{ scale: ratingScale[star - 1] }] }}>
                                <TouchableOpacity
                                    style={{ padding: 8 }}
                                    onPress={() => handleRatingSelect(star)}
                                    activeOpacity={0.7}
                                >
                                    <FontAwesome
                                        name={formData.rating >= star ? "star" : "star-o"}
                                        size={32}
                                        color={formData.rating >= star ? colors.rating : colors.textTertiary}
                                    />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>

                    {errors.rating ? (
                        <Text style={{ color: colors.error, fontSize: 14, textAlign: 'center' }}>
                            {errors.rating}
                        </Text>
                    ) : (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 14 }}>
                            {formData.rating === 0 ? "Tap to rate" :
                                formData.rating === 1 ? "Poor" :
                                    formData.rating === 2 ? "Fair" :
                                        formData.rating === 3 ? "Good" :
                                            formData.rating === 4 ? "Very Good" : "Excellent"}
                        </Text>
                    )}
                </Animated.View>

                {/* Review Title */}
                <Animated.View
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                        Review Title <Text style={{ color: colors.error }}>*</Text>
                    </Text>

                    <TextInput
                        placeholder="Summarize your experience in a title..."
                        placeholderTextColor={colors.textTertiary}
                        value={formData.title}
                        onChangeText={(text) => handleChange('title', text)}
                        style={{
                            borderWidth: errors.title ? 2 : 1,
                            borderColor: errors.title ? colors.error : colors.border,
                            borderRadius: 8,
                            padding: 12,
                            color: colors.text,
                            backgroundColor: colors.background,
                        }}
                    />

                    {errors.title ? (
                        <Text style={{ color: colors.error, fontSize: 14, marginTop: 4 }}>
                            {errors.title}
                        </Text>
                    ) : (
                        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>
                            A short, descriptive title helps others understand your review
                        </Text>
                    )}
                </Animated.View>

                {/* Review Comment */}
                <Animated.View
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                        Your Review <Text style={{ color: colors.error }}>*</Text>
                    </Text>

                    <TextInput
                        placeholder="Share your experience with this seller..."
                        placeholderTextColor={colors.textTertiary}
                        value={formData.comment}
                        onChangeText={(text) => handleChange('comment', text)}
                        multiline
                        numberOfLines={5}
                        style={{
                            borderWidth: errors.comment ? 2 : 1,
                            borderColor: errors.comment ? colors.error : colors.border,
                            borderRadius: 8,
                            padding: 12,
                            height: 120,
                            textAlignVertical: 'top',
                            color: colors.text,
                            backgroundColor: colors.background,
                        }}
                    />

                    {errors.comment ? (
                        <Text style={{ color: colors.error, fontSize: 14, marginTop: 4 }}>
                            {errors.comment}
                        </Text>
                    ) : (
                        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>
                            Your review helps other buyers make informed decisions
                        </Text>
                    )}
                </Animated.View>

                {/* Submit Button */}
                <Animated.View
                    style={{
                        marginTop: 8,
                        marginBottom: 40,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <Animated.View style={{ opacity: buttonOpacity }}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.primary,
                                paddingVertical: 14,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            onPress={handleSubmit}
                            disabled={submitting || formData.rating === 0 || formData.title.trim().length === 0 || formData.comment.trim().length === 0}
                            activeOpacity={0.7}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <FontAwesome name="check" size={18} color="white" style={{ marginRight: 8 }} />
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                                        Submit Review
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </ScrollView>

            <CustomAlert
                visible={isVisible}
                title={config.title}
                message={config.message}
                buttons={config.buttons}
                type={config.type as 'info' | 'success' | 'error' | 'warning'}
            />
        </SafeAreaView>
    );
}

// Helper to use CustomAlert hook
function useCustomAlert() {
    const [isVisible, setIsVisible] = useState(false);
    const [config, setConfig] = useState({
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'error' | 'warning',
        buttons: [{ text: 'OK', onPress: () => { } }]
    });

    const showAlert = (alertConfig: AlertConfig) => {
        setConfig(alertConfig);
        setIsVisible(true);
    };

    const hideAlert = () => {
        setIsVisible(false);
    };

    return { showAlert, isVisible, config, hideAlert };
}
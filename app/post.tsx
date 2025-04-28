import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Feather from 'react-native-vector-icons/Feather'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import BottomNavigation, { Tab } from '../components/BottomNavigation'
import { useTheme } from '../lib/theme/ThemeContext'
import ProtectedRoute from 'components/ProtectedRoute'
import { calculateEcoScore } from 'lib/functions/calculateEcoScore'
import { useAuth } from 'lib/auth/AuthContext'
import { useNavigation } from '@react-navigation/native'
import { uploadListing } from 'lib/backend/listings/uploadListing'
import { type UploadListing } from 'lib/types/main'
import { uploadImage } from 'lib/backend/listings/uploadImage'
import { categories } from 'lib/functions/category'
import * as ImagePicker from 'expo-image-picker'

export default function PostScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState<Tab["name"]>('post')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const [termsAgreed, setTermsAgreed] = useState(false)

  // Form animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  // Modal states
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [conditionModalVisible, setConditionModalVisible] = useState(false)
  const [ecoAttributesModalVisible, setEcoAttributesModalVisible] =
    useState(false)

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    ecoAttributes: [] as string[],
    negotiable: false,
  })

  const [images, setImages] = useState<
    { uri: string; type?: string; name?: string }[]
  >([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const conditions: {
    name: string
    iconName: string
  }[] = [
      { name: 'New', iconName: 'FaBoxOpen' },
      { name: 'Like New', iconName: 'MdCheckCircleOutline' },
      { name: 'Very Good', iconName: 'FaStar' },
      { name: 'Good', iconName: 'MdThumbUp' },
      { name: 'Acceptable', iconName: 'RiCheckboxBlankCircleLine' },
      { name: 'For Parts/Not Working', iconName: 'MdBuild' },
    ]

  // Eco-friendly attributes
  const ecoAttributes: string[] = [
    'Second-hand',
    'Refurbished',
    'Upcycled',
    'Locally Made',
    'Organic Material',
    'Biodegradable',
    'Energy Efficient',
    'Plastic-free',
    'Vegan',
    'Handmade',
    'Repaired',
  ]

  // Animation effect when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    const userLocation = user?.location || ''
    setFormData(prevData => ({
      ...prevData,
      location: userLocation,
    }))
  }, [user])

  // Handle form input changes
  const handleChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      })
    }
  }

  // Toggle eco attribute selection
  const toggleEcoAttribute = (attribute: string) => {
    if (formData.ecoAttributes.includes(attribute)) {
      setFormData({
        ...formData,
        ecoAttributes: formData.ecoAttributes.filter(a => a !== attribute),
      })
    } else {
      setFormData({
        ...formData,
        ecoAttributes: [...formData.ecoAttributes, attribute],
      })
    }
  }

  // Image picker function
  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images')
      return
    }

    setUploading(true)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        // Get the file extension from the URI
        const uri = result.assets[0].uri
        const fileExtension = uri.split('.').pop() || 'jpg'
        const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`

        const newImage = {
          uri: uri,
          type: mimeType,
          name: `image-${images.length}.${fileExtension}`,
        }

        console.log('Selected image:', newImage)
        setImages([...images, newImage])
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    } finally {
      setUploading(false)
    }
  }

  // Remove image
  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)

    const newImageFiles = [...imageFiles]
    newImageFiles.splice(index, 1)
    setImageFiles(newImageFiles)
  }

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters'
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters'
    }

    if (!formData.category) {
      errors.category = 'Please select a category'
    }

    if (!formData.condition) {
      errors.condition = 'Please select the condition'
    }

    if (!formData.price.trim()) {
      errors.price = 'Price is required'
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = 'Please enter a valid price'
    }

    if (images.length === 0) {
      errors.images = 'Please add at least one image'
    }

    if (!termsAgreed) {
      errors.terms = 'You must agree to the Terms and Conditions'
    }

    return errors
  }

  // Form submission
  const handleSubmit = async () => {
    // Clear previous errors
    setFormErrors({})

    // Validate form
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      })
      return
    }

    setSubmitting(true)

    try {
      // Check if user is available
      if (!user || !user.id) {
        throw new Error('You must be logged in to post a listing')
      }

      // 1. Upload the images first
      let imageUrlData
      try {
        if (images.length === 0) {
          throw new Error('Please add at least one image')
        }

        console.log('Starting image upload with', images.length, 'images')
        imageUrlData = await uploadImage(images, formData.title)

        if (
          !imageUrlData ||
          !imageUrlData.urls ||
          !Array.isArray(imageUrlData.urls) ||
          imageUrlData.urls.length === 0
        ) {
          console.error('Invalid image URLs received:', imageUrlData)
          throw new Error('Failed to get image URLs from server')
        }

      } catch (error) {
        console.error('Image upload error:', error)
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Failed to upload images. Please try again.',
        )
      }

      // 2. Create and submit the listing with the image URLs
      const listing: UploadListing = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        price: parseFloat(formData.price),
        negotiable: formData.negotiable,
        ecoAttributes: formData.ecoAttributes,
        ecoScore: calculateEcoScore(formData.ecoAttributes),
        imageUrl: imageUrlData.urls,
        sellerId: user.id,
      }

      console.log('Submitting listing with data:', listing)

      // Submit the listing to the backend
      const uploadResponse = await uploadListing(listing)
      if (!uploadResponse) {
        throw new Error('Failed to post listing: No response from server')
      }

      console.log('Successfully created listing:', uploadResponse)

      // Show success animation
      setShowSuccess(true)

      // Reset form and navigate after delay
      setTimeout(() => {
        setShowSuccess(false)
        setFormData({
          title: '',
          description: '',
          category: '',
          condition: '',
          price: '',
          ecoAttributes: [],
          negotiable: false,
        })
        setImages([])
        navigation.navigate('Listings' as never)
      }, 2000)
    } catch (error) {
      console.error('Error posting listing:', error)
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to post listing',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Function to open terms and conditions in browser
  const openTerms = () => {
    Linking.openURL('https://greentrade.eu/terms').catch(err => {
      console.error('Failed to open terms page:', err)
      Alert.alert(
        'Error',
        'Could not open terms page. Please check your internet connection.',
      )
    })
  }

  // Create the error component
  const ErrorDisplay = () => {
    const errorMessages = Object.values(formErrors)
    if (errorMessages.length === 0) return null

    return (
      <Animated.View
        style={{
          backgroundColor: colors.error,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600', marginBottom: 4 }}>
          Please fix the following issues:
        </Text>
        {errorMessages.map((error, index) => (
          <Text key={index} style={{ color: 'white', fontSize: 14 }}>
            • {error}
          </Text>
        ))}
      </Animated.View>
    )
  }

  return (
    <ProtectedRoute>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            backgroundColor: colors.card,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
            Create Listing
          </Text>
          <Text
            style={{ fontSize: 14, color: colors.textTertiary, marginTop: 4 }}
          >
            Share your sustainable items with the community
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1, padding: 16 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            <Animated.View
              style={{
                marginBottom: 24,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              {/* Error display */}
              <ErrorDisplay />

              {/* Success message */}
              {showSuccess && (
                <Animated.View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: fadeAnim,
                  }}
                >
                  <MaterialIcons name="check-circle" size={24} color="white" />
                  <Text
                    style={{ color: 'white', fontWeight: '600', marginLeft: 8 }}
                  >
                    Listing created successfully!
                  </Text>
                </Animated.View>
              )}

              {/* Photos section */}
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Photos {images.length > 0 && `${images.length}/5`}
                <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
                contentContainerStyle={{ gap: 10 }}
              >
                {images.map((image, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: image.uri }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                      }}
                    />
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={() => removeImage(index)}
                    >
                      <Feather name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 5 && (
                  <TouchableOpacity
                    style={{
                      width: 100,
                      height: 100,
                      backgroundColor: colors.card,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderStyle: 'dashed',
                    }}
                    onPress={pickImage}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <FontAwesome
                          name="camera"
                          size={24}
                          color={colors.textTertiary}
                        />
                        <Text
                          style={{
                            color: colors.textTertiary,
                            fontSize: 12,
                            marginTop: 8,
                          }}
                        >
                          Add Photo
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>
              {formErrors.images && (
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }}
                >
                  {formErrors.images}
                </Text>
              )}
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                First image will be the featured image. Add clear photos from
                multiple angles.
              </Text>

              {/* Title field */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Title <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                placeholder="e.g. Organic Cotton T-Shirt"
                placeholderTextColor={colors.textTertiary}
                value={formData.title}
                onChangeText={value => handleChange('title', value)}
                style={{
                  borderWidth: formErrors.title ? 2 : 1,
                  borderColor: formErrors.title ? colors.error : colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: formErrors.title ? 4 : 16,
                  color: colors.text,
                  backgroundColor: colors.card,
                }}
              />
              {formErrors.title && (
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                >
                  {formErrors.title}
                </Text>
              )}

              {/* Description field */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Description <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                placeholder="Describe your item and its eco-friendly qualities"
                placeholderTextColor={colors.textTertiary}
                value={formData.description}
                onChangeText={value => handleChange('description', value)}
                multiline
                numberOfLines={4}
                style={{
                  height: 100,
                  borderWidth: formErrors.description ? 2 : 1,
                  borderColor: formErrors.description
                    ? colors.error
                    : colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: formErrors.description ? 4 : 16,
                  textAlignVertical: 'top',
                  color: colors.text,
                  backgroundColor: colors.card,
                }}
              />
              {formErrors.description && (
                <Text
                  style={{ color: colors.error, fontSize: 14, marginBottom: 4 }}
                >
                  {formErrors.description}
                </Text>
              )}
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {formData.description.length}/1000 characters
              </Text>

              {/* Price field */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Price (€) <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: -16,
                    bottom: 0,
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Text style={{ color: colors.textSecondary }}>€</Text>
                </View>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.price}
                  onChangeText={value => handleChange('price', value)}
                  keyboardType="numeric"
                  style={{
                    borderWidth: formErrors.price ? 2 : 1,
                    borderColor: formErrors.price
                      ? colors.error
                      : colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    paddingLeft: 24,
                    marginBottom: formErrors.price ? 4 : 16,
                    color: colors.text,
                    backgroundColor: colors.card,
                  }}
                />
              </View>
              {formErrors.price && (
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                >
                  {formErrors.price}
                </Text>
              )}

              {/* Negotiable checkbox */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.highlight,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
                onPress={() =>
                  setFormData({ ...formData, negotiable: !formData.negotiable })
                }
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: formData.negotiable
                      ? colors.primary
                      : 'transparent',
                    borderWidth: 2,
                    borderColor: formData.negotiable
                      ? colors.primary
                      : colors.textSecondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {formData.negotiable && (
                    <Feather name="check" size={14} color="white" />
                  )}
                </View>
                <Text style={{ marginLeft: 8, color: colors.text }}>
                  Price is negotiable
                </Text>
              </TouchableOpacity>

              {/* Category selector */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Category <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: formErrors.category ? 2 : 1,
                  borderColor: formErrors.category
                    ? colors.error
                    : colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginBottom: formErrors.category ? 4 : 16,
                  backgroundColor: colors.card,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text
                  style={{
                    color: formData.category
                      ? colors.text
                      : colors.textTertiary,
                  }}
                >
                  {formData.category || 'Select a category'}
                </Text>
                <FontAwesome
                  name="chevron-down"
                  size={14}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
              {formErrors.category && (
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                >
                  {formErrors.category}
                </Text>
              )}

              {/* Condition selector */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Condition <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: formErrors.condition ? 2 : 1,
                  borderColor: formErrors.condition
                    ? colors.error
                    : colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginBottom: formErrors.condition ? 4 : 16,
                  backgroundColor: colors.card,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => setConditionModalVisible(true)}
              >
                <Text
                  style={{
                    color: formData.condition
                      ? colors.text
                      : colors.textTertiary,
                  }}
                >
                  {formData.condition || 'Select condition'}
                </Text>
                <FontAwesome
                  name="chevron-down"
                  size={14}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
              {formErrors.condition && (
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                >
                  {formErrors.condition}
                </Text>
              )}

              {/* Location field */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Location <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: -6,
                    bottom: 0,
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <FontAwesome
                    name="map-marker"
                    size={16}
                    color={colors.textSecondary}
                  />
                </View>
                <TextInput
                  placeholder="e.g. Berlin, Germany"
                  placeholderTextColor={colors.textTertiary}
                  value={user?.location}
                  editable={false}
                  aria-disabled={true}
                  style={{
                    borderWidth: formErrors.location ? 2 : 1,
                    borderColor: formErrors.location
                      ? colors.error
                      : colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    paddingLeft: 36,
                    marginBottom: formErrors.location ? 4 : 8,
                    color: colors.textTertiary,
                    backgroundColor: colors.card,
                  }}
                />
              </View>
              {formErrors.location && (
                <Text
                  style={{ color: colors.error, fontSize: 14, marginBottom: 8 }}
                >
                  {formErrors.location}
                </Text>
              )}
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                This cannot be edited. Your location is retrieved from your account.
              </Text>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                Your exact address will not be shared publicly
              </Text>
              {/* Eco-friendly Attributes */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  marginTop: 8,
                }}
              >
                <FontAwesome
                  name="leaf"
                  size={16}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Eco-friendly Attributes
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginBottom: 12,
                  backgroundColor: colors.card,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => setEcoAttributesModalVisible(true)}
              >
                <Text
                  style={{
                    color:
                      formData.ecoAttributes.length > 0
                        ? colors.text
                        : colors.textTertiary,
                  }}
                >
                  {formData.ecoAttributes.length > 0
                    ? `${formData.ecoAttributes.length} attributes selected`
                    : 'Select eco attributes'}
                </Text>
                <FontAwesome
                  name="chevron-down"
                  size={14}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>

              {formData.ecoAttributes.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {formData.ecoAttributes.map(attr => (
                    <View
                      key={attr}
                      style={{
                        backgroundColor: colors.primaryLight,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <FontAwesome
                        name="leaf"
                        size={12}
                        color={colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={{ color: colors.primary, fontSize: 12 }}>
                        {attr}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View
                style={{
                  backgroundColor: colors.highlight,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                  padding: 12,
                  marginBottom: 24,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: colors.primaryDark }}>
                  Items with eco-friendly attributes are more likely to be
                  featured on the homepage!
                </Text>
              </View>

              {/* Sustainability Rating */}
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 12,
                  marginTop: 8,
                }}
              >
                Sustainability Rating
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.highlight,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <FontAwesome name="leaf" size={20} color={colors.primary} />
                <Text
                  style={{ marginLeft: 8, color: colors.primaryDark, flex: 1 }}
                >
                  Eco score based on selected attributes
                </Text>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>
                    {calculateEcoScore(formData.ecoAttributes)}
                  </Text>
                </View>
              </View>

              {/* Terms agreement - Updated section */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: formErrors.terms ? 4 : 24,
                }}
                onPress={() => setTermsAgreed(!termsAgreed)}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: termsAgreed
                      ? colors.primary
                      : 'transparent',
                    borderWidth: 2,
                    borderColor: formErrors.terms
                      ? colors.error
                      : termsAgreed
                        ? colors.primary
                        : colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 2,
                  }}
                >
                  {termsAgreed && (
                    <Feather name="check" size={14} color="white" />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: colors.text }}>
                    I agree to the{' '}
                    <Text
                      style={{ color: colors.primary, fontWeight: 'bold' }}
                      onPress={openTerms}
                    >
                      Terms and Conditions
                    </Text>
                  </Text>
                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    By posting this listing, I confirm that I have the right to
                    sell this item and the information provided is accurate.
                  </Text>
                </View>
              </TouchableOpacity>

              {formErrors.terms && (
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    marginBottom: 24,
                    marginLeft: 28,
                  }}
                >
                  {formErrors.terms}
                </Text>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 6,
                  alignItems: 'center',
                  marginTop: 8,
                }}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={{ color: 'white', fontWeight: '600', fontSize: 16 }}
                  >
                    Create Listing
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Category Selector Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={categoryModalVisible}
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
                maxHeight: '70%',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Select Category
                </Text>
                <TouchableOpacity
                  onPress={() => setCategoryModalVisible(false)}
                >
                  <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: '90%' }}>
                {categories.slice(1).map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                    onPress={() => {
                      handleChange('category', category.name)
                      setCategoryModalVisible(false)
                    }}
                  >
                    <FontAwesome
                      name={category.icon}
                      size={20}
                      color={colors.primary}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ color: colors.text, flex: 1 }}>
                      {category.name}
                    </Text>
                    {formData.category === category.name && (
                      <FontAwesome
                        name="check"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Condition Selector Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={conditionModalVisible}
          onRequestClose={() => setConditionModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Select Condition
                </Text>
                <TouchableOpacity
                  onPress={() => setConditionModalVisible(false)}
                >
                  <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {conditions.map(condition => (
                  <TouchableOpacity
                    key={condition.name}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                    onPress={() => {
                      handleChange('condition', condition.name)
                      setConditionModalVisible(false)
                    }}
                  >
                    <Text style={{ color: colors.text, flex: 1 }}>
                      {condition.name}
                    </Text>
                    {formData.condition === condition.name && (
                      <FontAwesome
                        name="check"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Eco Attributes Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={ecoAttributesModalVisible}
          onRequestClose={() => setEcoAttributesModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
                maxHeight: '70%',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Eco-friendly Attributes
                </Text>
                <TouchableOpacity
                  onPress={() => setEcoAttributesModalVisible(false)}
                >
                  <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {ecoAttributes.map(attribute => (
                  <TouchableOpacity
                    key={attribute}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                    onPress={() => toggleEcoAttribute(attribute)}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        backgroundColor: formData.ecoAttributes.includes(
                          attribute,
                        )
                          ? colors.primary
                          : 'transparent',
                        borderWidth: 2,
                        borderColor: formData.ecoAttributes.includes(attribute)
                          ? colors.primary
                          : colors.textSecondary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      {formData.ecoAttributes.includes(attribute) && (
                        <Feather name="check" size={14} color="white" />
                      )}
                    </View>
                    <Text style={{ color: colors.text }}>{attribute}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 6,
                  alignItems: 'center',
                  marginTop: 16,
                }}
                onPress={() => setEcoAttributesModalVisible(false)}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>
    </ProtectedRoute>
  )
}

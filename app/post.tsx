import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../lib/theme/ThemeContext'
import ProtectedRoute from 'components/ProtectedRoute'

export default function PostScreen() {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState('post')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')

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

        <ScrollView style={{ flex: 1, padding: 16 }}>
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Photos
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
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
              >
                <FontAwesome name="camera" size={24} color={colors.textTertiary} />
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  Add Photo
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Title
            </Text>
            <TextInput
              placeholder="e.g. Organic Cotton T-Shirt"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
                color: colors.text,
                backgroundColor: colors.card,
              }}
            />

            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Description
            </Text>
            <TextInput
              placeholder="Describe your item and its eco-friendly qualities"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{
                height: 100,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
                textAlignVertical: 'top',
                color: colors.text,
                backgroundColor: colors.card,
              }}
            />

            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Price (€)
            </Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
                color: colors.text,
                backgroundColor: colors.card,
              }}
            />

            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Category
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
                backgroundColor: colors.card,
              }}
            >
              <Text style={{ color: colors.textTertiary }}>
                Select a category
              </Text>
            </View>

            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Location
            </Text>
            <TextInput
              placeholder="e.g. Berlin, Germany"
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
                color: colors.text,
                backgroundColor: colors.card,
              }}
            />

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
              <Text style={{ marginLeft: 8, color: colors.primaryDark, flex: 1 }}>
                Rate the eco-friendliness of your item (1-5)
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
                <Text style={{ color: 'white', fontWeight: '700' }}>4</Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 6,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Create Listing
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>
    </ProtectedRoute>
  )
}

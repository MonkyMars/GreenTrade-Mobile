import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import FontAwesome from "react-native-vector-icons/FontAwesome"
import BottomNavigation from '../components/BottomNavigation'

// Mock data for sustainability metrics
const sustainabilityData = [
  { id: 1, title: 'Carbon Saved', value: '125 kg', change: '+12%' },
  { id: 2, title: 'Items Recycled', value: '37', change: '+5' },
  { id: 3, title: 'Green Points', value: '1,450', change: '+230' },
]

// Mock data for recent transactions
const recentTransactions = [
  {
    id: 1,
    title: 'Recycled Glass Bottles',
    date: '2 Apr 2025',
    points: 45,
    amount: '+€2.25',
  },
  {
    id: 2,
    title: 'Recycled Paper',
    date: '1 Apr 2025',
    points: 30,
    amount: '+€1.50',
  },
  {
    id: 3,
    title: 'Purchased Eco Bag',
    date: '31 Mar 2025',
    points: -20,
    amount: '-€4.99',
  },
]

// Mock data for featured products
const featuredProducts = [
  { id: 1, name: 'Eco-friendly Water Bottle', price: '€19.99', image: '🍶' },
  { id: 2, name: 'Bamboo Toothbrush Set', price: '€12.50', image: '🪥' },
  { id: 3, name: 'Organic Cotton Tote', price: '€8.99', image: '👜' },
]

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <SafeAreaView className={styles.container}>
      {/* Header */}
      <View className={styles.header}>
        <View className={styles.headerLogo}>
          <FontAwesome name="leaf" size={24} color="#16a34a" />
          <Text className={styles.headerTitle}>GreenTrade</Text>
        </View>
        <View className={styles.headerIcons}>
          <TouchableOpacity className={styles.iconButton}>
            <FontAwesome name="bell" size={20} color="#4b5563" />
          </TouchableOpacity>
          <TouchableOpacity className={styles.iconButton}>
            <FontAwesome name="user" size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className={styles.scrollView}>
        {/* Welcome Section */}
        <View className={styles.welcomeSection}>
          <Text className={styles.welcomeText}>Welcome back, User!</Text>
          <Text className={styles.dateText}>April 4, 2025</Text>
        </View>

        {/* Sustainability Metrics */}
        <View className={styles.metricsContainer}>
          <Text className={styles.sectionTitle}>
            Your Sustainability Impact
          </Text>
          <View className={styles.metricsGrid}>
            {sustainabilityData.map(metric => (
              <View key={metric.id} className={styles.metricCard}>
                <Text className={styles.metricTitle}>{metric.title}</Text>
                <Text className={styles.metricValue}>{metric.value}</Text>
                <Text className={styles.metricChange}>{metric.change}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className={styles.actionSection}>
          <Text className={styles.sectionTitle}>Quick Actions</Text>
          <View className={styles.actionButtons}>
            <TouchableOpacity className={styles.actionButton}>
              <View className={styles.actionIconContainer}>
                <FontAwesome name="recycle" size={20} color="#ffffff" />
              </View>
              <Text className={styles.actionText}>Recycle</Text>
            </TouchableOpacity>

            <TouchableOpacity className={styles.actionButton}>
              <View className={styles.actionIconContainer}>
                <FontAwesome name="shopping-bag" size={20} color="#ffffff" />
              </View>
              <Text className={styles.actionText}>Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity className={styles.actionButton}>
              <View className={styles.actionIconContainer}>
                <FontAwesome name="line-chart" size={20} color="#ffffff" />
              </View>
              <Text className={styles.actionText}>Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View className={styles.recentActivity}>
          <Text className={styles.sectionTitle}>Recent Activity</Text>
          <View className={styles.transactionsList}>
            {recentTransactions.map(transaction => (
              <View key={transaction.id} className={styles.transactionItem}>
                <View>
                  <Text className={styles.transactionTitle}>
                    {transaction.title}
                  </Text>
                  <Text className={styles.transactionDate}>
                    {transaction.date}
                  </Text>
                </View>
                <View>
                  <Text className={styles.transactionAmount}>
                    {transaction.amount}
                  </Text>
                  <Text className={styles.transactionPoints}>
                    {transaction.points > 0
                      ? `+${transaction.points}`
                      : transaction.points}{' '}
                    pts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View className={styles.featuredProducts}>
          <Text className={styles.sectionTitle}>Featured Eco Products</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className={styles.productsScroll}
          >
            {featuredProducts.map(product => (
              <View key={product.id} className={styles.productCard}>
                <Text className={styles.productImage}>{product.image}</Text>
                <Text className={styles.productName}>{product.name}</Text>
                <Text className={styles.productPrice}>{product.price}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  )
}

const styles = {
  container: 'flex-1 bg-gray-100',
  header: 'flex-row items-center justify-between px-4 py-3 bg-white shadow',
  headerLogo: 'flex-row items-center',
  headerTitle: 'ml-2 text-xl font-bold text-green-600',
  headerIcons: 'flex-row',
  iconButton: 'ml-4 p-2',
  scrollView: 'flex-1',
  welcomeSection: 'p-4 bg-green-50',
  welcomeText: 'text-2xl font-bold text-gray-800',
  dateText: 'text-gray-500 mt-1',
  metricsContainer: 'p-4',
  sectionTitle: 'text-lg font-semibold text-gray-800 mb-3',
  metricsGrid: 'flex-row justify-between',
  metricCard: 'bg-white p-3 rounded-lg shadow flex-1 mx-1 items-center',
  metricTitle: 'text-gray-500 text-xs',
  metricValue: 'text-xl font-bold text-gray-800 mt-1',
  metricChange: 'text-green-500 text-xs mt-1',
  actionSection: 'p-4',
  actionButtons: 'flex-row justify-around mt-2',
  actionButton: 'items-center',
  actionIconContainer:
    'w-12 h-12 bg-green-600 rounded-full items-center justify-center',
  actionText: 'text-gray-800 mt-2 text-xs',
  recentActivity: 'p-4',
  transactionsList: 'bg-white rounded-lg shadow p-3',
  transactionItem: 'flex-row justify-between py-2 border-b border-gray-100',
  transactionTitle: 'font-medium text-gray-800',
  transactionDate: 'text-xs text-gray-500',
  transactionAmount: 'text-right font-bold text-gray-800',
  transactionPoints: 'text-right text-xs text-green-600',
  featuredProducts: 'p-4',
  productsScroll: 'pt-2',
  productCard: 'bg-white p-3 rounded-lg shadow mr-4 w-32 items-center',
  productImage: 'text-4xl mb-2',
  productName: 'text-center text-sm font-medium text-gray-800',
  productPrice: 'text-center text-green-600 font-bold mt-1',
}

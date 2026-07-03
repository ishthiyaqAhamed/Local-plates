import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOrder, OrderStatus } from '../../context/orderContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { router } from 'expo-router';

// Type definitions for route params
type RootStackParamList = {
  OrderConfirmation: { orderId: string };
  Home: undefined;
  OrderHistory: undefined;
};

type OrderConfirmationRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OrderConfirmation: React.FC = () => {
  const route = useRoute<OrderConfirmationRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { orderId } = route.params || {};
  const { getOrderById, currentOrder, loading, error } = useOrder();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        await getOrderById(orderId);
        setIsLoaded(true);
      }
    };

    loadOrder();
  }, [orderId]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return '#FFC107'; // Yellow
      case OrderStatus.PROCESSING:
        return '#2196F3'; // Blue
      case OrderStatus.SHIPPED:
        return '#9C27B0'; // Purple
      case OrderStatus.DELIVERED:
        return '#4CAF50'; // Green
      case OrderStatus.CANCELLED:
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'schedule';
      case OrderStatus.PROCESSING:
        return 'settings';
      case OrderStatus.SHIPPED:
        return 'local-shipping';
      case OrderStatus.DELIVERED:
        return 'check-circle';
      case OrderStatus.CANCELLED:
        return 'cancel';
      default:
        return 'help-outline';
    }
  };

  if (loading && !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your order...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentOrder) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="help-outline" size={50} color="#FFC107" />
        <Text style={styles.errorText}>Order not found. Please check your order ID.</Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: '#FFC107' }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format the order date
  const orderDate = currentOrder.createdAt && currentOrder.createdAt.toDate 
    ? new Date(currentOrder.createdAt.toDate()).toLocaleString()
    : 'Processing';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
        <Text style={styles.headerTitle}>Order Confirmed!</Text>
        <Text style={styles.headerSubtitle}>Thank you for your order</Text>
      </View>

      <View style={styles.orderInfoContainer}>
        <View style={styles.orderNumberRow}>
          <Text style={styles.orderLabel}>Order Number:</Text>
          <Text style={styles.orderNumber}>{currentOrder.id}</Text>
        </View>
        
        <View style={styles.orderInfoRow}>
          <Text style={styles.orderLabel}>Date:</Text>
          <Text style={styles.orderValue}>{orderDate}</Text>
        </View>

        <View style={styles.orderInfoRow}>
          <Text style={styles.orderLabel}>Status:</Text>
          <View style={styles.statusContainer}>
            <MaterialIcons 
              name={getStatusIcon(currentOrder.status)} 
              size={18} 
              color={getStatusColor(currentOrder.status)} 
              style={styles.statusIcon} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(currentOrder.status) }]}>
              {currentOrder.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfoRow}>
          <Text style={styles.orderLabel}>Payment:</Text>
          <Text style={styles.orderValue}>{currentOrder.paymentType}</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Items in Your Order</Text>
        {currentOrder.items.map((item : any, index : any) => (
          <View key={`${item.productId}-${index}`} style={styles.itemContainer}>
            {item.images && item.images.length > 0 ? (
              <Image 
                source={{ uri: item.images[0] }} 
                style={styles.itemImage} 
              
              />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialIcons name="image" size={24} color="#CCCCCC" />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              <Text style={styles.itemPrice}>
                Rs. {item.price} x {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              Rs. {item.price * item.quantity}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        <View style={styles.deliveryInfoItem}>
          <MaterialIcons name="location-on" size={20} color="#FF5722" style={styles.deliveryIcon} />
          <View style={styles.deliveryTextContainer}>
            <Text style={styles.deliveryLabel}>Address:</Text>
            <Text style={styles.deliveryValue}>
              {currentOrder.deliveryInfo.address}, {currentOrder.deliveryInfo.city},
              {'\n'}{currentOrder.deliveryInfo.province} {currentOrder.deliveryInfo.zipCode}
            </Text>
          </View>
        </View>
        
        <View style={styles.deliveryInfoItem}>
          <MaterialIcons name="phone" size={20} color="#2196F3" style={styles.deliveryIcon} />
          <View style={styles.deliveryTextContainer}>
            <Text style={styles.deliveryLabel}>Phone:</Text>
            <Text style={styles.deliveryValue}>{currentOrder.deliveryInfo.phone}</Text>
          </View>
        </View>
        
        <View style={styles.deliveryInfoItem}>
          <MaterialIcons name="local-shipping" size={20} color="#4CAF50" style={styles.deliveryIcon} />
          <View style={styles.deliveryTextContainer}>
            <Text style={styles.deliveryLabel}>Delivery Method:</Text>
            <Text style={styles.deliveryValue}>{currentOrder.deliveryInfo.deliveryType}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>Rs. {currentOrder.subtotal}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee:</Text>
          <Text style={styles.summaryValue}>Rs. {currentOrder.deliveryInfo.deliveryCharge}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Fee:</Text>
          <Text style={styles.summaryValue}>Rs. {currentOrder.appFee}</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>Rs. {currentOrder.total}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() =>  router.push("/(user)/orders")}
        >
          <Text style={styles.buttonText}>View All Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push("/(user)/")}
        >
          <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  orderInfoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  orderLabel: {
    fontSize: 15,
    color: '#666666',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
  },
  orderValue: {
    fontSize: 15,
    color: '#333333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  deliveryInfoItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  deliveryIcon: {
    marginTop: 2,
    width: 22,
  },
  deliveryTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  deliveryLabel: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 4,
  },
  deliveryValue: {
    fontSize: 15,
    color: '#333333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333333',
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 10,
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderConfirmation;
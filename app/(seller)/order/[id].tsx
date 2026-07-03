import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrder, OrderStatus, Order } from "../../../context/orderContext";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, updateOrderStatus, loading, error } = useOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) {
      Alert.alert("Error", "No order ID provided");
      return;
    }

    setPageLoading(true);
    const fetchedOrder = await getOrderById(id as string);
    if (fetchedOrder) {
      setOrder(fetchedOrder);
    }
    setPageLoading(false);
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "#FFA500"; // Orange
      case OrderStatus.PROCESSING:
        return "#3498DB"; // Blue
      case OrderStatus.SHIPPED:
        return "#9B59B6"; // Purple
      case OrderStatus.DELIVERED:
        return "#2ECC71"; // Green
      case OrderStatus.CANCELLED:
        return "#E74C3C"; // Red
      default:
        return "#7F8C8D"; // Gray
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: OrderStatus) => {
    Alert.alert(
      "Update Order Status",
      `Are you sure you want to change the status to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            if (id) {
              await updateOrderStatus(id as string, newStatus);
              loadOrder(); // Refresh order data
            }
          },
        },
      ]
    );
  };

  if (pageLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#E74C3C" />
          <Text style={styles.errorText}>Order not found</Text>
          <Text style={styles.errorSubtext}>
            {error || "The order you're looking for doesn't exist"}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Order ID and Status */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>
              Order #{order.id?.substring(0, 8)}
            </Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { borderColor: getStatusColor(order.status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(order.status) },
              ]}
            >
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{order.userName}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{order.userEmail}</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY INFORMATION</Text>
          {order.deliveryInfo.coordinates && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: order.deliveryInfo.coordinates.latitude,
                  longitude: order.deliveryInfo.coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={order.deliveryInfo.coordinates}
                  pinColor="deeppink" // Rose-like color
                  title="Delivery Location"
                />
              </MapView>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{order.deliveryInfo.address}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>City:</Text>
            <Text style={styles.infoValue}>{order.deliveryInfo.city}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Province:</Text>
            <Text style={styles.infoValue}>{order.deliveryInfo.province}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Zip Code:</Text>
            <Text style={styles.infoValue}>{order.deliveryInfo.zipCode}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{order.deliveryInfo.phone}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Delivery Type:</Text>
            <Text style={styles.infoValue}>
              {order.deliveryInfo.deliveryType}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ORDER ITEMS ({order.items.length})
          </Text>
          {order.items.map((item, index) => (
            <View key={item.productId + index} style={styles.itemContainer}>
              <View style={styles.itemImageContainer}>
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.itemImage}
                  />
                ) : (
                  <Ionicons name="fast-food" size={30} color="#FF3366" />
                )}
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  LKR{item.price.toFixed(2)} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                LKR{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Payment Type:</Text>
            <Text style={styles.infoValue}>{order.paymentType}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Payment Status:</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: order.paymentStatus === "paid" ? "#2ECC71" : "#FFA500",
                },
              ]}
            >
              {order.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                LKR{order.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>App Fee:</Text>
              <Text style={styles.summaryValue}>
                LKR{order.appFee.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge:</Text>
              <Text style={styles.summaryValue}>
                LKR{order.deliveryInfo.deliveryCharge.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.summaryLabelTotal}>Total:</Text>
              <Text style={styles.summaryValueTotal}>
                LKR{order.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Update Buttons */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>UPDATE ORDER STATUS</Text>

          {order.status !== OrderStatus.PROCESSING && (
            <TouchableOpacity
              style={[
                styles.statusButton,
                { backgroundColor: "#3498DB" },
                (order.status === OrderStatus.CANCELLED ||
                  order.status === OrderStatus.DELIVERED) &&
                  styles.disabledButton,
              ]}
              onPress={() => handleStatusUpdate(OrderStatus.PROCESSING)}
              disabled={
                order.status === OrderStatus.CANCELLED ||
                order.status === OrderStatus.DELIVERED
              }
            >
              <Text style={styles.statusButtonText}>MARK AS PROCESSING</Text>
            </TouchableOpacity>
          )}

          {order.status !== OrderStatus.SHIPPED && (
            <TouchableOpacity
              style={[
                styles.statusButton,
                { backgroundColor: "#9B59B6" },
                (order.status === OrderStatus.CANCELLED ||
                  order.status === OrderStatus.DELIVERED) &&
                  styles.disabledButton,
              ]}
              onPress={() => handleStatusUpdate(OrderStatus.SHIPPED)}
              disabled={
                order.status === OrderStatus.CANCELLED ||
                order.status === OrderStatus.DELIVERED
              }
            >
              <Text style={styles.statusButtonText}>MARK AS SHIPPED</Text>
            </TouchableOpacity>
          )}

          {order.status !== OrderStatus.DELIVERED && (
            <TouchableOpacity
              style={[
                styles.statusButton,
                { backgroundColor: "#2ECC71" },
                order.status === OrderStatus.CANCELLED && styles.disabledButton,
              ]}
              onPress={() => handleStatusUpdate(OrderStatus.DELIVERED)}
              disabled={order.status === OrderStatus.CANCELLED}
            >
              <Text style={styles.statusButtonText}>MARK AS DELIVERED</Text>
            </TouchableOpacity>
          )}

          {order.status !== OrderStatus.CANCELLED && (
            <TouchableOpacity
              style={[
                styles.statusButton,
                { backgroundColor: "#E74C3C" },
                order.status === OrderStatus.DELIVERED && styles.disabledButton,
              ]}
              onPress={() => handleStatusUpdate(OrderStatus.CANCELLED)}
              disabled={order.status === OrderStatus.DELIVERED}
            >
              <Text style={styles.statusButtonText}>CANCEL ORDER</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backToOrdersButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToOrdersText}>BACK TO ORDERS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    color: "#E74C3C",
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    color: "#666",
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
  },
  itemImageContainer: {
    width: 50,
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  itemImage: {
    width: 50,
    height: 50,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: "#666",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    width: 70,
    textAlign: "right",
  },
  summaryContainer: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryValueTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3366",
  },
  actionSection: {
    padding: 16,
  },
  statusButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  statusButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
  },
  backToOrdersButton: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  backToOrdersText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mapContainer: {
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
});

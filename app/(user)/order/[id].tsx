// app/(user)/order/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrder, OrderStatus, Order } from "../../../context/orderContext";
import { Ionicons } from "@expo/vector-icons";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, cancelOrder, loading } = useOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;

    setRefreshing(true);
    const orderData = await getOrderById(id as string);
    if (orderData) {
      setOrder(orderData);
    }
    setRefreshing(false);
  };

  const handleCancelOrder = async () => {
    if (!order || !order.id) return;

    // Only allow cancellation if the order is still pending
    if (order.status !== OrderStatus.PENDING) {
      alert("Only pending orders can be cancelled");
      return;
    }

    await cancelOrder(order.id);
    loadOrder(); // Refresh order data
  };

  if (loading || refreshing) {
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
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Go back to orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Status */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Ionicons
              name={getStatusIcon(order.status)}
              size={30}
              color="#fff"
            />
          </View>
          <Text style={styles.statusTitle}>{getStatusLabel(order.status)}</Text>
          <Text style={styles.statusDescription}>
            {getStatusDescription(order.status)}
          </Text>
        </View>

        {/* Order Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Order Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>#{order.id?.substring(0, 8)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment</Text>
            <Text style={styles.infoValue}>{order.paymentType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text
              style={[
                styles.infoValue,
                { color: getStatusColor(order.status) },
              ]}
            >
              {order.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Delivery Information</Text>

          <View style={styles.addressContainer}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#666"
              style={styles.addressIcon}
            />
            <View style={styles.addressDetails}>
              <Text style={styles.addressText}>
                {order.deliveryInfo.address}, {order.deliveryInfo.city},
                {order.deliveryInfo.province} {order.deliveryInfo.zipCode}
              </Text>
              <Text style={styles.phoneText}>{order.deliveryInfo.phone}</Text>
              <Text style={styles.deliveryType}>
                {order.deliveryInfo.deliveryType} Delivery
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Order Items</Text>

          {order.items.map((item, index) => (
            <View
              key={`${item.productId}-${index}`}
              style={styles.itemContainer}
            >
              <View style={styles.itemImageContainer}>
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="fast-food-outline" size={24} color="#999" />
                  </View>
                )}
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.sellerName}>
                  Sold by: {item.sellerName}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>
                    LKR {item.price.toFixed(2)} × {item.quantity}
                  </Text>
                  <Text style={styles.itemTotal}>
                    LKR {(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Order Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                LKR {order.subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                LKR {order.deliveryInfo.deliveryCharge.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>App Fee</Text>
              <Text style={styles.summaryValue}>
                LKR {order.appFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                LKR {order.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {order.status === OrderStatus.DELIVERED && (
            <TouchableOpacity style={styles.reviewButton}>
              <Ionicons
                name="star-outline"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>WRITE A REVIEW</Text>
            </TouchableOpacity>
          )}

          {order.status === OrderStatus.PENDING && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>CANCEL ORDER</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.supportButton}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>CONTACT SUPPORT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
const formatDate = (timestamp: any): string => {
  if (!timestamp) return "N/A";

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: OrderStatus): string => {
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

const getStatusIcon = (
  status: OrderStatus
):
  | "time-outline"
  | "restaurant-outline"
  | "bicycle-outline"
  | "checkmark-circle-outline"
  | "close-circle-outline"
  | "help-circle-outline" => {
  switch (status) {
    case OrderStatus.PENDING:
      return "time-outline";
    case OrderStatus.PROCESSING:
      return "restaurant-outline";
    case OrderStatus.SHIPPED:
      return "bicycle-outline";
    case OrderStatus.DELIVERED:
      return "checkmark-circle-outline";
    case OrderStatus.CANCELLED:
      return "close-circle-outline";
    default:
      return "help-circle-outline";
  }
};

const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return "Order Placed";
    case OrderStatus.PROCESSING:
      return "Order is Being Prepared";
    case OrderStatus.SHIPPED:
      return "Out for Delivery";
    case OrderStatus.DELIVERED:
      return "Order Delivered";
    case OrderStatus.CANCELLED:
      return "Order Cancelled";
    default:
      return "Unknown Status";
  }
};

const getStatusDescription = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return "Your order has been received and is waiting to be processed.";
    case OrderStatus.PROCESSING:
      return "Your order is being prepared by the restaurant.";
    case OrderStatus.SHIPPED:
      return "Your order is on the way to your location!";
    case OrderStatus.DELIVERED:
      return "Your order has been delivered. Enjoy your meal!";
    case OrderStatus.CANCELLED:
      return "This order has been cancelled.";
    default:
      return "";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    fontSize: 20,
    fontWeight: "bold",
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
    fontSize: 18,
    color: "#E74C3C",
    marginTop: 12,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: "#3498DB",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  statusIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  addressContainer: {
    flexDirection: "row",
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressDetails: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  deliveryType: {
    fontSize: 14,
    color: "#FF3366",
    fontWeight: "500",
  },
  itemContainer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemPrice: {
    fontSize: 14,
    color: "#666",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
  },
  summaryContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3366",
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  reviewButton: {
    backgroundColor: "#FFA500",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: "#E74C3C",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  supportButton: {
    backgroundColor: "#3498DB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

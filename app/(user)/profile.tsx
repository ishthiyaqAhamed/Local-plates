import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  useOrder,
  OrderStatus,
  OrderSummary,
} from "../../context/orderContext";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { userOrders, getUserOrders, loading, error } = useOrder();
  const router = useRouter();

  // State for pending reviews and orders to be received
  const [ordersToReview, setOrdersToReview] = useState<OrderSummary[]>([]);
  const [ordersToReceive, setOrdersToReceive] = useState<OrderSummary[]>([]);

  // Debug output to check what's happening
  console.log("User:", user?.uid);
  console.log("UserOrders count:", userOrders?.length);
  console.log("UserOrders:", JSON.stringify(userOrders));

  useEffect(() => {
    if (user) {
      // Make sure to call getUserOrders to fetch the latest orders
      getUserOrders();
    }
  }, [user]);

  useEffect(() => {
    if (userOrders && userOrders.length > 0) {
      console.log("Processing orders...");

      // Filter orders that need to be reviewed (delivered orders)
      const toReview = userOrders.filter(
        (order) => order.status === OrderStatus.DELIVERED
      );

      // Filter orders that are on the way (processing or shipped)
      const toReceive = userOrders.filter(
        (order) =>
          order.status === OrderStatus.SHIPPED ||
          order.status === OrderStatus.PROCESSING
      );

      console.log("Orders to review:", toReview.length);
      console.log("Orders to receive:", toReceive.length);

      setOrdersToReview(toReview);
      setOrdersToReceive(toReceive);
    } else {
      // Reset states when no orders are available
      setOrdersToReview([]);
      setOrdersToReceive([]);
    }
  }, [userOrders]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/(user)/order/${orderId}`);
  };

  const handleSettingsPress = () => {
    router.push("/(user)/settings");
  };

  const handleAllOrdersPress = () => {
    router.push("/(user)/orders");
  };

  // For manual refetch of orders
  const handleRefreshOrders = () => {
    getUserOrders();
  };

  // Placeholder for avatar if no image is available
  const renderAvatar = () => {
    if (user?.photoURL) {
      return (
        <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
      );
    } else {
      return (
        <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
          </Text>
        </View>
      );
    }
  };

  if (loading && !userOrders.length) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Debug UI for developers - remove in production */}
        {__DEV__ && error && (
          <View style={styles.debugContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefreshOrders}
            >
              <Text style={styles.refreshButtonText}>Refresh Orders</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Info Section */}
        <View style={styles.profileHeader}>
          {renderAvatar()}
          <Text style={styles.userName}>{user?.displayName || "User"}</Text>
          <Text style={styles.userLocation}>
            {user?.city
              ? `${user.city.toUpperCase()}, ${user?.province || ""}`
              : ""}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <Text style={styles.settingsButtonText}>SETTINGS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={handleAllOrdersPress}
          >
            <Text style={styles.orderButtonText}>ORDER</Text>
          </TouchableOpacity>
        </View>

        {/* Orders To Be Received Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TO BE RECEIVED</Text>
            {userOrders.length > 0 && (
              <TouchableOpacity onPress={handleAllOrdersPress}>
                <Text style={styles.viewAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.ordersContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : ordersToReceive.length > 0 ? (
              ordersToReceive.slice(0, 3).map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => handleOrderPress(order.id)}
                >
                  <View style={styles.orderCardContent}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderId}>
                        Order #{order.id.substring(0, 8)}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatDate(order.date)}
                      </Text>
                    </View>
                    <View style={styles.orderStatus}>
                      <Text style={styles.orderItems}>
                        {order.itemCount} items
                      </Text>
                      <Text style={styles.orderTotal}>
                        LKR {order.total.toFixed(2)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.trackingButton}>
                    <Text style={styles.trackingButtonText}>TRACK</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="bicycle-outline" size={36} color="#ccc" />
                <Text style={styles.emptyStateText}>No pending deliveries</Text>
              </View>
            )}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to format date
const formatDate = (timestamp: any): string => {
  if (!timestamp) return "N/A";

  // Handle Firestore timestamp
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Get status color based on order status
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

// Get user-friendly status label
const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PROCESSING:
      return "Preparing";
    case OrderStatus.SHIPPED:
      return "On the way";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  debugContainer: {
    backgroundColor: "#ffeeee",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 20,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#555",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  settingsButton: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    marginRight: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  orderButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#000",
    marginLeft: 8,
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllText: {
    fontSize: 12,
    color: "#666",
  },
  ordersContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 8,
    minHeight: 150,
  },
  orderCard: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  orderCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  orderStatus: {
    alignItems: "flex-end",
  },
  orderItems: {
    fontSize: 12,
    color: "#666",
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  statusBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  reviewButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  trackingButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  trackingButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: "#000",
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
});

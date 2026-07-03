import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { useOrder, OrderStatus } from "../../../context/orderContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function SellerHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sellerOrders, getSellerOrders, loading, error } = useOrder();
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "ALL">("ALL");
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    const fetchData = async () => {
      setLoadingScreen(true);
      if (user) {
        await getSellerOrders();
      }
      setLoadingScreen(false);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    };

    fetchData();
  }, [user]);

  // Calculate order statistics
  useEffect(() => {
    if (sellerOrders.length > 0) {
      const stats = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
      
      sellerOrders.forEach(order => {
        switch (order.status) {
          case OrderStatus.PENDING:
            stats.pending++;
            break;
          case OrderStatus.PROCESSING:
            stats.processing++;
            break;
          case OrderStatus.SHIPPED:
            stats.shipped++;
            break;
          case OrderStatus.DELIVERED:
            stats.delivered++;
            break;
          case OrderStatus.CANCELLED:
            stats.cancelled++;
            break;
        }
      });
      
      setOrderStats(stats);
    }
  }, [sellerOrders]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Navigate to settings
  const navigateToSettings = () => {
    router.push("/(seller)/settings");
  };

  // Navigate to order details
  const navigateToOrderDetails = (orderId: string) => {
    router.push(`/(seller)/order/${orderId}`);
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

  // Filter orders by status
  const filteredOrders = activeFilter === "ALL" 
    ? sellerOrders
    : sellerOrders.filter(order => order.status === activeFilter);

  // Reviews for UI demo
  const reviews = [
    {
      id: "review1",
      userName: "USER 1",
      productName: "ABOUT FOOD NO.4",
      rating: 4.5,
      text: "I'd Give Basbousa A Solid 9/10! 👌\nIt's Sweet, Moist, And Has That Perfect Balance Of Semolina Texture With Syrupy Goodness. The Coconut Adds A Nice Touch, And When It's Made Just Right—Not Too Dry Or Too Soggy—It's An Absolute Treat!",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&size=256",
      date: "Mar 28, 2025",
    },
    {
      id: "review2",
      userName: "USER 2",
      productName: "ABOUT FOOD NO.1",
      rating: 5,
      text: "The best homemade food I've had in months! Flavor was incredible, and the portion size was perfect. Will definitely order again soon!",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&size=256",
      date: "Mar 25, 2025",
    },
  ];

  if ((loadingScreen || loading) && sellerOrders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
      } else if (i === fullStars && halfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={14} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={14} color="#FFD700" />);
      }
    }
    
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logoText}>Local Plates</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/(seller)/products")}>
                <Ionicons name="cart-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={navigateToSettings}>
                <Ionicons name="settings-outline" size={22} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sellerInfoContainer}>
            <TouchableOpacity
              style={styles.sellerAvatarContainer}
              onPress={navigateToSettings}
            >
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.sellerAvatar}
                />
              ) : (
                <Ionicons name="person" size={35} color="#fff" />
              )}
            </TouchableOpacity>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>
                {user?.businessName ||
                  `SELLER ID ${user?.uid.substring(0, 7) || "1077114"}`}
              </Text>
              <Text style={styles.sellerLocation}>
                {user?.city
                  ? `${user.city.toUpperCase()}, ${
                      user.province?.toUpperCase() || "SRI LANKA"
                    }`
                  : "COLOMBO, SRI LANKA"}
              </Text>
            </View>
          </View>

          {/* Dashboard Stats */}
          <View style={styles.dashboardContainer}>
            <Text style={styles.dashboardTitle}>DASHBOARD</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{sellerOrders.length}</Text>
                <Text style={styles.statLabel}>TOTAL</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderStats.pending}</Text>
                <Text style={styles.statLabel}>PENDING</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderStats.processing + orderStats.shipped}</Text>
                <Text style={styles.statLabel}>ACTIVE</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderStats.delivered}</Text>
                <Text style={styles.statLabel}>DELIVERED</Text>
              </View>
            </View>
          </View>

          {/* Order Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === "ALL" && styles.filterButtonActive]}
                onPress={() => setActiveFilter("ALL")}
              >
                <Text style={[styles.filterText, activeFilter === "ALL" && styles.filterTextActive]}>ALL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === OrderStatus.PENDING && styles.filterButtonActive]}
                onPress={() => setActiveFilter(OrderStatus.PENDING)}
              >
                <Text style={[styles.filterText, activeFilter === OrderStatus.PENDING && styles.filterTextActive]}>PENDING</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === OrderStatus.PROCESSING && styles.filterButtonActive]}
                onPress={() => setActiveFilter(OrderStatus.PROCESSING)}
              >
                <Text style={[styles.filterText, activeFilter === OrderStatus.PROCESSING && styles.filterTextActive]}>PROCESSING</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === OrderStatus.SHIPPED && styles.filterButtonActive]}
                onPress={() => setActiveFilter(OrderStatus.SHIPPED)}
              >
                <Text style={[styles.filterText, activeFilter === OrderStatus.SHIPPED && styles.filterTextActive]}>SHIPPED</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === OrderStatus.DELIVERED && styles.filterButtonActive]}
                onPress={() => setActiveFilter(OrderStatus.DELIVERED)}
              >
                <Text style={[styles.filterText, activeFilter === OrderStatus.DELIVERED && styles.filterTextActive]}>DELIVERED</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === OrderStatus.CANCELLED && styles.filterButtonActive]}
                onPress={() => setActiveFilter(OrderStatus.CANCELLED)}
              >
                <Text style={[styles.filterText, activeFilter === OrderStatus.CANCELLED && styles.filterTextActive]}>CANCELLED</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <Text style={styles.sectionTitle}>ORDERS ({filteredOrders.length})</Text>

          <View style={styles.ordersContainer}>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <View key={order.id} style={styles.orderItem}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderItemName}>
                        Order #{order.id.substring(0, 8)}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatDate(order.date)}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
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

                  <View style={styles.orderSummary}>
                    <Text style={styles.orderItemDetail}>
                      <Text style={styles.detailLabel}>Items: </Text>
                      {order.itemCount}
                    </Text>
                    <Text style={styles.orderItemDetail}>
                      <Text style={styles.detailLabel}>Total: </Text>LKR
                      {order.total.toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => navigateToOrderDetails(order.id)}
                  >
                    <Text style={styles.manageButtonText}>MANAGE</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={40} color="#666" />
                <Text style={styles.emptyText}>No orders found</Text>
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>
            )}
          </View>

          {/* Reviews Section with enhanced UI */}
          <Text style={styles.sectionTitle}>CUSTOMER REVIEWS</Text>

          <View style={styles.reviewsContainer}>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={{ uri: review.avatar }}
                    style={styles.reviewerAvatar}
                  />
                  <View style={styles.reviewHeaderInfo}>
                    <View style={styles.reviewerNameRow}>
                      <Text style={styles.reviewerName}>{review.userName}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <Text style={styles.reviewItemName}>{review.productName}</Text>
                    <View style={styles.ratingContainer}>
                      {renderStars(review.rating)}
                      <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(seller)/products")}
            >
              <Ionicons name="grid-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>MY PRODUCTS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(seller)/sell")}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>ADD NEW FOOD</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#333",
  },
  headerButtons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
  },
  sellerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  sellerAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FF3366",
  },
  sellerAvatar: {
    width: "100%",
    height: "100%",
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sellerLocation: {
    fontSize: 14,
    color: "#FF3366",
    marginTop: 4,
  },
  dashboardContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF3366",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  filtersContainer: {
    marginVertical: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterButtonActive: {
    backgroundColor: "#FF3366",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  filterTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    color: "#333",
  },
  ordersContainer: {
    paddingHorizontal: 16,
  },
  orderItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
    borderLeftWidth: 4,
    borderLeftColor: "#FF3366",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderItemDetail: {
    fontSize: 14,
    color: "#666",
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#333",
  },
  manageButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 5,
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#E74C3C",
    marginTop: 8,
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  reviewItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  reviewHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FF3366",
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  reviewerNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  reviewItemName: {
    fontSize: 12,
    color: "#FF3366",
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#FFD700",
    marginLeft: 6,
    fontWeight: "bold",
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#333",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
    flexDirection: "column",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 8,
  }
});
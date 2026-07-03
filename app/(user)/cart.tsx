import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ToastAndroid,
} from "react-native";
import { useCart } from "../../context/cartContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CartScreen() {
  const { cart, removeFromCart, clearCart, updateQuantity, getTotalAmount } = useCart();

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
    ToastAndroid.show("Item removed from cart!", ToastAndroid.SHORT);
  };

  const handleIncreaseQuantity = (productId: string) => {
    updateQuantity(productId, 1);
  };

  const handleDecreaseQuantity = (productId: string, quantity: number) => {
    if (quantity > 1) {
      updateQuantity(productId, -1);
    } else {
      handleRemoveItem(productId);
    }
  };

  const handlePlaceOrder = () => {
    router.push("/(user)/checkout");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Your Cart</Text>
        {cart.length > 0 && (
          <Text style={styles.itemCount}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</Text>
        )}
      </View>
      
      <ScrollView style={styles.cartContent}>
        {cart.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Ionicons name="cart-outline" size={80} color="#aaa" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => router.push("/(user)/")}
            >
              <Text style={styles.shopNowButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cart.map((product) => (
              <View key={product.id} style={styles.cartItem}>
                <Image
                  source={{ uri: (product.images && product.images[0]) || "https://via.placeholder.com/100" }}
                  style={styles.productImage}
                />
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>LKR {product.price.toFixed(2)}</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleDecreaseQuantity(product.id, product.quantity)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{product.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleIncreaseQuantity(product.id)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.itemTotalPrice}>
                      LKR {(product.price * product.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(product.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#777" />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.cartSummary}>
              <Text style={styles.summaryTitle}>Cart Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>LKR {getTotalAmount().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>LKR 0.00</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Estimated Total</Text>
                <Text style={styles.totalValue}>LKR {getTotalAmount().toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.clearCartButton} 
            onPress={clearCart}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.clearCartText}>Clear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.orderButton} 
            onPress={handlePlaceOrder}
          >
            <Text style={styles.orderButtonText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
  },
  itemCount: {
    fontSize: 14,
    color: "#666",
  },
  cartContent: {
    flex: 1,
  },
  emptyCartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 10,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f4f4f4",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#eee",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 12,
    color: "#333",
    minWidth: 20,
    textAlign: "center",
  },
  itemTotalPrice: {
    marginLeft: "auto",
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  removeButton: {
    padding: 8,
    alignSelf: "flex-start",
  },
  cartSummary: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#555",
  },
  summaryValue: {
    fontSize: 15,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  bottomPadding: {
    height: 80,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  clearCartButton: {
    backgroundColor: "#444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  clearCartText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  orderButton: {
    backgroundColor: "#000",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
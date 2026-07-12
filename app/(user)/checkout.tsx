import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ToastAndroid,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useCart } from "../../context/cartContext";
import { useOrder, DeliveryInfo } from "../../context/orderContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";

export default function CheckoutScreen() {
  const { cart, getTotalAmount } = useCart();
  const { placeOrder, loading: orderLoading, error: orderError } = useOrder();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { lat, lng } = useLocalSearchParams();

  const [deliveryType, setDeliveryType] = useState<"Standard" | "Express">(
    "Standard"
  );
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [address, setAddress] = useState("123 Main Street");
  const [city, setCity] = useState("Colombo");
  const [province, setProvince] = useState("Western");
  const [zipCode, setZipCode] = useState("10300");
  const [phone, setPhone] = useState("0712345678");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    if (lat && lng) {
      const selectedLat = parseFloat(lat as string);
      const selectedLng = parseFloat(lng as string);

      setLatitude(selectedLat);
      setLongitude(selectedLng);

      reverseGeocode(selectedLat, selectedLng);
    } else {
      getCurrentLocation();
    }
  }, [lat, lng]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  async function getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setLatitude(latitude);
      setLongitude(longitude);

      reverseGeocode(latitude, longitude);
    } catch (err) {
      console.error("Error getting location:", err);
      Alert.alert("Error", "Failed to get current location");
    }
  }

  async function reverseGeocode(latitude: number, longitude: number) {
    try {
      const [geoData] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (geoData) {
        setAddress(`${geoData.name} ${geoData.street}`);
        setCity(geoData.city || "Unknown");
        setProvince(geoData.region || "Unknown");
        setZipCode(geoData.postalCode || "00000");
      }
    } catch (err) {
      console.error("Error in reverse geocoding:", err);
    }
  }

  const appFee = 50;
  const deliveryCharge = deliveryType === "Standard" ? 150 : 300;
  const subtotal = getTotalAmount();
  const total = subtotal + appFee + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please log in or create an account to place an order.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => router.push("/(auth)/login") },
        ]
      );
      return;
    }

    setIsPlacingOrder(true);

    try {
      const deliveryInfo: DeliveryInfo = {
        address,
        city,
        province,
        zipCode,
        phone,
        deliveryType,
        deliveryCharge,
        coordinates:
          latitude && longitude ? { latitude, longitude } : undefined,
      };

      const orderId = await placeOrder(deliveryInfo, "Cash on Delivery");

      if (orderId) {
        ToastAndroid.show("Order placed successfully!", ToastAndroid.SHORT);
        router.push("/(user)/confirmation");
      } else {
        Alert.alert(
          "Error",
          orderError || "Failed to place order. Please try again."
        );
      }
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.header}>Checkout</Text>
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <View style={styles.locationBox}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#333"
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>
              {address}, {city}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/select-location")}
          style={{
            marginVertical: 10,
            backgroundColor: "#000",
            padding: 12,
            borderRadius: 6,
            alignItems: "center",
            marginHorizontal: 16,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Set Delivery Location on Map
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Type</Text>
          <View style={styles.deliveryOptions}>
            {["Standard", "Express"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.deliveryOption,
                  deliveryType === type && styles.selectedDeliveryOption,
                ]}
                onPress={() => setDeliveryType(type as "Standard" | "Express")}
              >
                <Text
                  style={[
                    styles.deliveryText,
                    deliveryType === type && styles.selectedDeliveryText,
                  ]}
                >
                  {type}
                </Text>
                {deliveryType === type && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#fff"
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image
                source={{
                  uri:
                    (item.images && item.images[0]) ||
                    "https://via.placeholder.com/100",
                }}
                style={styles.image}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  LKR {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Subtotal</Text>
            <Text style={styles.feeAmount}>LKR {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>App Fee</Text>
            <Text style={styles.feeAmount}>LKR {appFee.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Delivery Charge</Text>
            <Text style={styles.feeAmount}>
              LKR {deliveryCharge.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalAmount}>LKR {total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Payment Method</Text>
          <View style={styles.paymentOption}>
            <Ionicons name="cash-outline" size={24} color="#333" />
            <Text style={styles.paymentText}>Cash on Delivery</Text>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder || orderLoading}
        >
          {isPlacingOrder || orderLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: {
    padding: 5,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#222",
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    color: "#333",
    fontSize: 15,
  },
  deliveryOptions: {
    flexDirection: "row",
    marginTop: 4,
  },
  deliveryOption: {
    padding: 12,
    paddingRight: 16,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 120,
  },
  selectedDeliveryOption: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  deliveryText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 15,
  },
  selectedDeliveryText: {
    color: "#fff",
  },
  checkIcon: {
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#222",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#555",
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  summaryBox: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  feeLabel: {
    color: "#555",
    fontSize: 15,
  },
  feeAmount: {
    fontSize: 15,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  paymentBox: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#222",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 15,
    marginLeft: 10,
    color: "#333",
  },
  spacer: {
    height: 80,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
  },
  placeOrderButton: {
    backgroundColor: "#000",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 8,
    flexDirection: "row",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
});
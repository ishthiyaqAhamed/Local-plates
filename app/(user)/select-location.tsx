import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getCurrentUserLocation,
  DEFAULT_COORDS,
  reverseGeocodeCoordinates,
} from "../../services/locationService";
import UniversalMap from "../../components/UniversalMap";
import { showToast } from "../../services/toast";

export default function SelectLocationScreen() {
  const router = useRouter();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
  });
  const [addressPreview, setAddressPreview] = useState<string>("Colombo Main Street, Colombo");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setLocating(true);
    try {
      const result = await getCurrentUserLocation();
      setCoords(result.coords);
      setAddressPreview(`${result.addressInfo.address}, ${result.addressInfo.city}`);
    } catch (err) {
      console.warn("Could not fetch location for map:", err);
    } finally {
      setLocating(false);
    }
  };

  const handleCoordinateChange = async (newCoords: { latitude: number; longitude: number }) => {
    setCoords(newCoords);
    try {
      const info = await reverseGeocodeCoordinates(newCoords.latitude, newCoords.longitude);
      setAddressPreview(`${info.address}, ${info.city}`);
    } catch {}
  };

  const handleConfirm = () => {
    router.push({
      pathname: "/(user)/checkout",
      params: {
        lat: coords.latitude.toString(),
        lng: coords.longitude.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pin Delivery Location</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map Area */}
      <View style={styles.mapWrapper}>
        <UniversalMap
          latitude={coords.latitude}
          longitude={coords.longitude}
          onCoordinateChange={handleCoordinateChange}
          title="Delivery Pin"
        />

        {/* Floating GPS Button */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={detectLocation}
          activeOpacity={0.8}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#FF3366" />
          ) : (
            <Ionicons name="locate" size={22} color="#FF3366" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Confirmation Card */}
      <View style={styles.bottomCard}>
        <View style={styles.addressRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={20} color="#FF3366" />
          </View>
          <View style={styles.addressTextCol}>
            <Text style={styles.addressLabel}>Selected Address</Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {addressPreview}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          style={styles.confirmBtn}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmBtnText}>Confirm Delivery Location</Text>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  gpsBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFE4E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addressTextCol: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: "#FF3366",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

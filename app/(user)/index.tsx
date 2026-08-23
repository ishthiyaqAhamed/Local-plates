import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useShop } from "../../context/shopContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

const { width: windowWidth } = Dimensions.get("window");
const MAX_CONTENT_WIDTH = 480;
const width = Math.min(windowWidth, MAX_CONTENT_WIDTH);
const itemWidth = (width - 48) / 3;
const isWeb = Platform.OS === "web";

type CategoryType =
  | "Rice"
  | "Noodles"
  | "Pizza"
  | "Burger"
  | "Sweets"
  | "Desserts"
  | "Drinks"
  | "Vegetarian"
  | "Non Vegetarian"
  | "Seafood"
  | string;

export default function BuyerHomeScreen() {
  const { productTypes, loading, fetchProducts, shops, fetchNearShops } =
    useShop();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [address, setAddress] = useState("123 Main Street");
  const [city, setCity] = useState("Colombo");
  const [province, setProvince] = useState("Western");
  const [zipCode, setZipCode] = useState("10300");
  const [phone, setPhone] = useState("0712345678");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const router = useRouter();
  const { lat, lng } = useLocalSearchParams();

  const categoryIcons: Record<CategoryType, keyof typeof Ionicons.glyphMap> = {
    Rice: "restaurant-outline",
    Noodles: "restaurant-outline",
    Pizza: "pizza-outline",
    Burger: "fast-food-outline",
    Sweets: "ice-cream-outline",
    Desserts: "ice-cream-outline",
    Drinks: "cafe-outline",
    Vegetarian: "leaf-outline",
    "Non Vegetarian": "restaurant-outline",
    Seafood: "fish-outline",
  };

  const getCategoryIcon = (
    category: CategoryType
  ): keyof typeof Ionicons.glyphMap => {
    return categoryIcons[category] || "fast-food-outline";
  };

  useEffect(() => {
    fetchProducts();
  }, []);
  useEffect(() => {
    if (lat && lng) {
      const selectedLat = parseFloat(lat as string);
      const selectedLng = parseFloat(lng as string);

      setLatitude(selectedLat);
      setLongitude(selectedLng);
      setLocationLoading(false);
      setLocationError(null);

      reverseGeocode(selectedLat, selectedLng);
      fetchNearShops(selectedLat, selectedLng);
    } else {
      getCurrentLocation();
    }
  }, [lat, lng]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  async function getCurrentLocation() {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permission denied — set address manually");
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setLatitude(latitude);
      setLongitude(longitude);

      await reverseGeocode(latitude, longitude);
      fetchNearShops(latitude, longitude);
    } catch (err) {
      console.error("Error getting location:", err);
      setLocationError("Couldn't detect location — set manually");
    } finally {
      setLocationLoading(false);
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

  const handleCategorySelect = (type: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn("Haptics error:", error);
    }
    setSelectedType(type);
  };

  const handleShopPress = (shopId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn("Haptics error:", error);
    }
    router.push(`(user)/shops/${shopId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const renderLoadingShimmer = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.shimmerContainer}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={styles.shimmerItem}>
            <View style={styles.shimmerImage} />
            <View style={styles.shimmerText} />
            <View style={styles.shimmerSmallText} />
          </View>
        ))}
      </View>
    </View>
  );

  const getFoodIcon = (index: number): keyof typeof Ionicons.glyphMap => {
    const icons: Array<keyof typeof Ionicons.glyphMap> = [
      "fast-food-outline",
      "pizza-outline",
      "restaurant-outline",
      "cafe-outline",
      "beer-outline",
    ];
    return icons[index % icons.length];
  };

  return (
    <View style={styles.pageBackdrop}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/Register.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.iconRow}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push(`(user)/search`)}
              >
                <Feather name="search" size={20} color="#222" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  Alert.alert(
                    "Notifications",
                    "You're all caught up — no new notifications yet."
                  )
                }
              >
                <Feather name="bell" size={20} color="#222" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery location card */}
          <TouchableOpacity
            style={styles.locationCard}
            activeOpacity={0.8}
            onPress={() => router.push("/select-location-home")}
          >
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              {locationLoading ? (
                <View style={styles.locationLoadingRow}>
                  <ActivityIndicator size="small" color="#FF3366" />
                  <Text style={styles.locationValueMuted}>
                    Detecting your location...
                  </Text>
                </View>
              ) : locationError ? (
                <Text style={styles.locationValueError}>{locationError}</Text>
              ) : (
                <Text style={styles.locationValue} numberOfLines={1}>
                  {address}, {city}
                </Text>
              )}
            </View>
            <View style={styles.changePill}>
              <Text style={styles.changePillText}>Change</Text>
            </View>
          </TouchableOpacity>

          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Good day! 👋</Text>
            <Text style={styles.questionText}>
              What would you like to eat today?
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.categorySection}>
            {loading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
              >
                {[1, 2, 3, 4, 5].map((item) => (
                  <View
                    key={item}
                    style={[styles.categoryButton, styles.categoryButtonShimmer]}
                  />
                ))}
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {productTypes.map((type) => (
                  <TouchableOpacity
                  key={type}
                    style={[
                      styles.categoryButton,
                      selectedType === type && styles.selectedCategory,
                    ]}
                    onPress={() => handleCategorySelect(type)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={getCategoryIcon(type as CategoryType)}
                      size={22}
                      color={selectedType === type ? "#fff" : "#FF3366"}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedType === type && styles.selectedCategoryText,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Nearby Shops */}
          <View style={styles.shopsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="location-outline" size={18} color="#FF3366" />
                <Text style={styles.sectionTitle}>Nearby homemade sellers</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push("/(user)/search")}
              >
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              renderLoadingShimmer()
            ) : shops.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={30} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No sellers found near you yet
                </Text>
              </View>
            ) : (
              <View style={styles.shopContainer}>
                {shops.map((shop, index) => (
                  <TouchableOpacity
                    key={shop.uid}
                    style={styles.shopItem}
                    onPress={() => handleShopPress(shop.uid)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.imageContainer}>
                      {shop.photoURL ? (
                        <Image
                          source={{ uri: shop.photoURL }}
                          style={styles.foodImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.foodImageFallback,
                            { backgroundColor: getColorForIndex(index) },
                          ]}
                        >
                          <Ionicons
                            name={getFoodIcon(index)}
                            size={30}
                            color="#fff"
                          />
                        </View>
                      )}
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.55)"]}
                        style={styles.imageGradient}
                      />
                    </View>
                    <Text
                      style={styles.shopName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {shop.businessName}
                    </Text>
                    <View style={styles.shopInfoRow}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={13} color="#FFC107" />
                        <Text style={styles.ratingText}>
                          {shop.rating || "4.5"}
                        </Text>
                      </View>
                      <View style={styles.distanceContainer}>
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color="#999"
                        />
                        <Text style={styles.distanceText}>1.2 km</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Popular This Week Section */}
          <View style={styles.popularSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flame-outline" size={18} color="#FF3366" />
                <Text style={styles.sectionTitle}>Popular this week</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push("/(user)/search")}
              >
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#FF3366"
                style={styles.loader}
              />
            ) : shops.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="flame-outline" size={30} color="#ccc" />
                <Text style={styles.emptyStateText}>Nothing trending yet</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popularScrollContent}
              >
                {shops.slice(0, 5).map((shop, index) => (
                  <TouchableOpacity
                    key={`popular-${shop.uid}`}
                    style={styles.popularItem}
                    onPress={() => handleShopPress(shop.uid)}
                    activeOpacity={0.8}
                  >
                    {shop.photoURL ? (
                      <Image
                        source={{ uri: shop.photoURL }}
                        style={styles.popularImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.popularImageFallback,
                          { backgroundColor: getColorForIndex(index + 5) },
                        ]}
                      >
                        <Ionicons
                          name={getFoodIcon(index + 5)}
                          size={40}
                          color="#fff"
                        />
                      </View>
                    )}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.65)"]}
                      style={styles.popularImageGradient}
                    />
                    <View style={styles.popularInfo}>
                      <Text style={styles.popularName} numberOfLines={1}>
                        {shop.businessName}
                      </Text>
                      <View style={styles.popularSubInfo}>
                        <Ionicons name="star" size={12} color="#FFC107" />
                        <Text style={styles.popularRating}>
                          {shop.rating || "4.5"}
                        </Text>
                        <Text style={styles.popularCategory}>• Homemade</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getColorForIndex = (index: number): string => {
  const colors = [
    "#FF3366",
    "#3498DB",
    "#2ECC71",
    "#F39C12",
    "#9B59B6",
    "#E74C3C",
    "#1ABC9C",
    "#34495E",
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  pageBackdrop: {
    flex: 1,
    backgroundColor: isWeb ? "#F2F2F5" : "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    ...(isWeb
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
        }
      : {}),
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoImage: {
    width: 120,
    height: 36,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F5F7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: "#FFF5F7",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFE0E7",
  },
  locationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  locationLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  locationValue: {
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
    marginTop: 2,
  },
  locationValueMuted: {
    fontSize: 13,
    color: "#777",
    marginLeft: 6,
  },
  locationLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  locationValueError: {
    fontSize: 13,
    color: "#c0392b",
    marginTop: 2,
    fontWeight: "500",
  },
  changePill: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD3DE",
  },
  changePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF3366",
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 6,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  questionText: {
    fontSize: 14,
    color: "#777",
  },
  categorySection: {
    marginTop: 18,
  },
  categoryScrollView: {
    paddingLeft: 20,
  },
  categoryScrollContent: {
    paddingRight: 20,
  },
  categoryButton: {
    backgroundColor: "#FAFAFA",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    width: 92,
    height: 84,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  categoryButtonShimmer: {
    backgroundColor: "#f0f0f0",
  },
  selectedCategory: {
    backgroundColor: "#FF3366",
    borderColor: "#FF3366",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
    color: "#333",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  shopsSection: {
    marginTop: 26,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginLeft: 6,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#F5F5F7",
  },
  viewAllText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 13,
    color: "#999",
    marginTop: 8,
  },
  shopContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  shopItem: {
    width: itemWidth,
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
  },
  foodImage: {
    width: "100%",
    height: 100,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
  },
  foodImageFallback: {
    width: "100%",
    height: 100,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  shopName: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    color: "#222",
  },
  shopInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 11,
    color: "#555",
    marginLeft: 3,
    fontWeight: "600",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    fontSize: 11,
    color: "#999",
    marginLeft: 2,
  },
  loadingContainer: {
    marginTop: 10,
  },
  shimmerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  shimmerItem: {
    width: itemWidth,
    marginBottom: 20,
  },
  shimmerImage: {
    width: "100%",
    height: 100,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
  },
  shimmerText: {
    height: 14,
    width: "80%",
    marginTop: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  shimmerSmallText: {
    height: 10,
    width: "50%",
    marginTop: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  loader: {
    marginVertical: 20,
  },
  popularSection: {
    marginTop: 26,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  popularScrollContent: {
    paddingRight: 20,
  },
  popularItem: {
    width: 150,
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  popularImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  popularImageFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  popularImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
  },
  popularInfo: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  popularName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  popularSubInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  popularRating: {
    fontSize: 11,
    color: "#fff",
    marginLeft: 4,
    marginRight: 6,
    fontWeight: "600",
  },
  popularCategory: {
    fontSize: 11,
    color: "#eee",
  },
});
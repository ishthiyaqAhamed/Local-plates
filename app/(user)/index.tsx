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

const { width } = Dimensions.get("window");
const itemWidth = (width - 48) / 3;

// Define the allowed category types
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
  const router = useRouter();
  const { lat, lng } = useLocalSearchParams();
  // Category icons mapping
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

  // Get icon for a category
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
      // ✅ User selected a location manually — override current location
      const selectedLat = parseFloat(lat as string);
      const selectedLng = parseFloat(lng as string);

      setLatitude(selectedLat);
      setLongitude(selectedLng);

      // Reverse geocode selected coordinates to get address
      reverseGeocode(selectedLat, selectedLng);
      fetchNearShops(selectedLat, selectedLng);
    } else {
      // ✅ No selected location — fallback to device's current location
      getCurrentLocation();
    }
  }, [lat, lng]);

  // 🗺️ Get location from device
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // 🛰️ Get current device location
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
      fetchNearShops(latitude, longitude);
    } catch (err) {
      console.error("Error getting location:", err);
      Alert.alert("Error", "Failed to get current location");
    }
  }

  // 🔁 Reusable function to reverse geocode
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

  // Get random food icon for missing images
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
          <View style={styles.iconContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push(`(user)/search`)}
            >
              <Feather name="search" size={22} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

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
          onPress={() => router.push("/select-location-home")}
          style={{
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

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Good day!</Text>
          <Text style={styles.questionText}>
            WHAT WOULD YOU LIKE TO EAT TODAY?
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
                    size={24}
                    color={selectedType === type ? "#fff" : "#333"}
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
              <Text style={styles.sectionTitle}>NEARBY HOMEMADE SELLERS</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            renderLoadingShimmer()
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
                          size={32}
                          color="#fff"
                        />
                      </View>
                    )}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.7)"]}
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
                      <Ionicons name="star" size={14} color="#FFC107" />
                      <Text style={styles.ratingText}>
                        {shop.rating || "4.5"}
                      </Text>
                    </View>
                    <View style={styles.distanceContainer}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#777"
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
              <Text style={styles.sectionTitle}>POPULAR THIS WEEK</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF3366"
              style={styles.loader}
            />
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
                        size={42}
                        color="#fff"
                      />
                    </View>
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
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
  );
}

// Function to get color based on index
const getColorForIndex = (index: number): string => {
  const colors = [
    "#FF3366", // Pink
    "#3498DB", // Blue
    "#2ECC71", // Green
    "#F39C12", // Orange
    "#9B59B6", // Purple
    "#E74C3C", // Red
    "#1ABC9C", // Teal
    "#34495E", // Navy
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  greetingContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    letterSpacing: 0.5,
  },
  categorySection: {
    marginTop: 16,
  },
  categoryScrollView: {
    paddingLeft: 16,
  },
  categoryScrollContent: {
    paddingRight: 16,
  },
  categoryButton: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 90,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
    marginRight: 12,
  },
  categoryButtonShimmer: {
    backgroundColor: "#f0f0f0",
  },
  selectedCategory: {
    backgroundColor: "#FF3366",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
    color: "#333",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  shopsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  viewAllText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
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
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  foodImage: {
    width: "100%",
    height: 110,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  foodImageFallback: {
    width: "100%",
    height: 110,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  promotedTag: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  promotedText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  shopName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    color: "#333",
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
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
    fontWeight: "500",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    fontSize: 12,
    color: "#777",
    marginLeft: 2,
  },
  popularSection: {
    marginTop: 24,
    paddingLeft: 16,
  },
  popularScrollContent: {
    paddingRight: 16,
  },
  popularItem: {
    width: width * 0.7,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  popularImage: {
    width: "100%",
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  popularImageFallback: {
    width: "100%",
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  popularImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  popularInfo: {
    padding: 12,
  },
  popularName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  popularSubInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  popularRating: {
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
    marginRight: 6,
  },
  popularCategory: {
    fontSize: 12,
    color: "#777",
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
    height: 110,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  shimmerText: {
    height: 16,
    width: "80%",
    marginTop: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  shimmerSmallText: {
    height: 12,
    width: "50%",
    marginTop: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  loader: {
    marginVertical: 20,
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  locationBox: {
    marginTop: 8,
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
});

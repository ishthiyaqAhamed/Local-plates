import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useShop } from "../../context/shopContext";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

const isWeb = Platform.OS === "web";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1800&auto=format&fit=crop";

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

// Responsive breakpoints — how many shop cards per row and how wide the
// content area gets, based on the current window width.
function getResponsiveLayout(winW: number) {
  if (winW >= 1200) {
    return { columns: 6, contentMaxWidth: 1180, gutter: 24, cardGap: 20 };
  }
  if (winW >= 900) {
    return { columns: 5, contentMaxWidth: 900, gutter: 24, cardGap: 18 };
  }
  if (winW >= 700) {
    return { columns: 4, contentMaxWidth: 700, gutter: 20, cardGap: 16 };
  }
  if (winW >= 480) {
    return { columns: 3, contentMaxWidth: winW, gutter: 20, cardGap: 14 };
  }
  return { columns: 3, contentMaxWidth: winW, gutter: 16, cardGap: 12 };
}

export default function BuyerHomeScreen() {
  const { productTypes, loading, fetchProducts, shops, fetchNearShops } =
    useShop();
  const { user } = useAuth();
  const { width: winW } = useWindowDimensions();
  const layout = getResponsiveLayout(winW);
  const itemWidth =
    (layout.contentMaxWidth -
      layout.gutter * 2 -
      layout.cardGap * (layout.columns - 1)) /
    layout.columns;
  const isNarrow = winW < 700;

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
  const scrollRef = useRef<ScrollView>(null);
  const [shopsSectionY, setShopsSectionY] = useState(0);

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

  const scrollToShops = () => {
    scrollRef.current?.scrollTo({ y: Math.max(shopsSectionY - 20, 0), animated: true });
  };

  const renderLoadingShimmer = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.shimmerContainer}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View
            key={item}
            style={[styles.shimmerItem, { width: itemWidth }]}
          >
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* ---------- HERO ---------- */}
        <ImageBackground
          source={{ uri: HERO_IMAGE_URL }}
          style={[styles.hero, { minHeight: isNarrow ? 420 : 460 }]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.75)"]}
                        style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.heroInner,
              { paddingHorizontal: isNarrow ? 20 : 40 },
            ]}
          >
            {/* Nav bar — spans the full hero width, edge to edge */}
            <View style={styles.navBar}>
              <View style={styles.navLeft}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => router.push("/(user)/profile")}
                >
                  <Feather name="menu" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.navLogo}>Local Plates</Text>
              </View>

              {user ? (
                <View style={styles.navRight}>
                  <TouchableOpacity
                    style={styles.navIconButton}
                    onPress={() => router.push(`(user)/search`)}
                  >
                    <Feather name="search" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navIconButton}
                    onPress={() =>
                      Alert.alert(
                        "Notifications",
                        "You're all caught up — no new notifications yet."
                      )
                    }
                  >
                    <Feather name="bell" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.navRight}>
                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={() => router.push("/(auth)/login")}
                  >
                    <Text style={styles.loginBtnText}>Log in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.signupBtn}
                    onPress={() => router.push("/(auth)/register")}
                  >
                    <Text style={styles.signupBtnText}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Hero content block — headline + search, capped narrower
                than the nav bar so it doesn't stretch edge to edge on
                very wide screens (matches how Uber Eats does it) */}
            <View style={{ maxWidth: 640, width: "100%" }}>
              {/* Headline */}
              <View style={styles.heroTextBlock}>
                <Text
                  style={[styles.heroTitle, { fontSize: isNarrow ? 30 : 44 }]}
                >
                  Order homemade food{"\n"}near you
                </Text>
                <Text style={styles.heroSubtitle}>
                  Fresh meals from local home cooks, delivered to your door
                </Text>
              </View>

              {/* Address / search bar */}
              <View
                style={[
                  styles.heroSearchBar,
                  isNarrow && { flexDirection: "column", alignItems: "stretch" },
                ]}
              >
                <TouchableOpacity
                  style={styles.heroAddressField}
                  onPress={() => router.push("/select-location-home")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location-outline" size={18} color="#666" />
                  {locationLoading ? (
                    <View style={styles.heroAddressLoadingRow}>
                      <ActivityIndicator size="small" color="#FF3366" />
                      <Text style={styles.heroAddressLoadingText}>
                        Detecting location...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.heroAddressText} numberOfLines={1}>
                      {locationError ? locationError : `${address}, ${city}`}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.findFoodBtn,
                    isNarrow && { marginTop: 10, marginLeft: 0, width: "100%" },
                  ]}
                  onPress={scrollToShops}
                >
                  <Text style={styles.findFoodBtnText}>Find Food</Text>
                </TouchableOpacity>
              </View>

              {!user && (
                <TouchableOpacity onPress={() => router.push("/(user)")}>
                  <Text style={styles.orGuestText}>Or continue as guest</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ImageBackground>

        {/* ---------- BODY ---------- */}
        <View
          style={[
            styles.contentWrap,
            { maxWidth: layout.contentMaxWidth, paddingHorizontal: layout.gutter },
          ]}
        >
          {/* Category Selection */}
          <View style={styles.categorySection}>
            {loading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <View
                    key={item}
                    style={[styles.categoryButton, styles.categoryButtonShimmer]}
                  />
                ))}
              </ScrollView>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                      size={20}
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
          <View
            style={styles.shopsSection}
            onLayout={(e) => setShopsSectionY(e.nativeEvent.layout.y)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="location-outline" size={17} color="#FF3366" />
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
                <Ionicons name="storefront-outline" size={28} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No sellers found near you yet
                </Text>
              </View>
            ) : (
              <View style={[styles.shopContainer, { gap: layout.cardGap }]}>
                {shops.map((shop, index) => (
                  <TouchableOpacity
                    key={shop.uid}
                    style={{ width: itemWidth, marginBottom: 20 }}
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
                            size={26}
                            color="#fff"
                          />
                        </View>
                      )}
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.5)"]}
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
                        <Ionicons name="star" size={12} color="#FFC107" />
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
                      
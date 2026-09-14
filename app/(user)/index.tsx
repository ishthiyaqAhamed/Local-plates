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

const DEFAULT_CATEGORIES = [
  { name: "Rice & Curry", icon: "restaurant-outline" as const },
  { name: "Biryani", icon: "flame-outline" as const },
  { name: "Noodles", icon: "restaurant-outline" as const },
  { name: "Burger", icon: "fast-food-outline" as const },
  { name: "Pizza", icon: "pizza-outline" as const },
  { name: "Short Eats", icon: "cafe-outline" as const },
  { name: "Desserts", icon: "ice-cream-outline" as const },
  { name: "Drinks", icon: "wine-outline" as const },
  { name: "Healthy", icon: "leaf-outline" as const },
];

function getResponsiveLayout(winW: number) {
  if (winW >= 1200) {
    return { columns: 5, contentMaxWidth: 1200, gutter: 32, cardGap: 24 };
  }
  if (winW >= 900) {
    return { columns: 4, contentMaxWidth: 960, gutter: 24, cardGap: 20 };
  }
  if (winW >= 700) {
    return { columns: 3, contentMaxWidth: 720, gutter: 20, cardGap: 16 };
  }
  if (winW >= 480) {
    return { columns: 2, contentMaxWidth: winW, gutter: 16, cardGap: 14 };
  }
  return { columns: 2, contentMaxWidth: winW, gutter: 16, cardGap: 12 };
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
  const isNarrow = winW < 768;

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
  const promoScrollRef = useRef<ScrollView>(null);
  const [shopsSectionY, setShopsSectionY] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);

  const promos = [
    {
      title: "20% off your first order",
      subtitle: "New to Local Plates? Get a discount on your first meal",
      icon: "gift-outline" as const,
      colors: ["#FF3366", "#FF6B8B"] as const,
    },
    {
      title: "Free delivery today",
      subtitle: "Orders over LKR 1,500 qualify for free delivery",
      icon: "bicycle-outline" as const,
      colors: ["#2980B9", "#3498DB"] as const,
    },
    {
      title: "Support local home cooks",
      subtitle: "Every order helps a home-based seller grow their business",
      icon: "heart-outline" as const,
      colors: ["#8E44AD", "#A569BD"] as const,
    },
  ];

  useEffect(() => {
    if (isNarrow) {
      const interval = setInterval(() => {
        setPromoIndex((prev) => {
          const next = (prev + 1) % promos.length;
          promoScrollRef.current?.scrollTo({
            x: next * (winW - 40),
            animated: true,
          });
          return next;
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [winW, isNarrow]);

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

  const availableCategories =
    productTypes && productTypes.length > 0
      ? productTypes.map((t) => ({
          name: t,
          icon: getCategoryIcon(t as CategoryType),
        }))
      : DEFAULT_CATEGORIES;

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

  const liveBatches = [
    {
      id: "lb-1",
      dishName: "Claypot Jaffna Crab Curry",
      chefName: "Kamala's Hearth",
      status: "Simmering Now",
      portionsLeft: 3,
      readyTime: "Ready in 15m",
      price: "LKR 1,600",
      rating: "4.9★",
      tag: "Claypot Spice",
      badgeColor: "#FF4757",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "lb-2",
      dishName: "Woodfired Dum Biryani",
      chefName: "Fatima's Kitchen",
      status: "Fresh from Oven",
      portionsLeft: 5,
      readyTime: "Ready in 10m",
      price: "LKR 1,250",
      rating: "5.0★",
      tag: "Secret Recipe",
      badgeColor: "#2ED573",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: "lb-3",
      dishName: "Hot String Hoppers & Kiri Hodi",
      chefName: "Granny Mary's Table",
      status: "Steaming Fresh",
      portionsLeft: 6,
      readyTime: "Ready in 5m",
      price: "LKR 750",
      rating: "4.8★",
      tag: "Breakfast / Dinner",
      badgeColor: "#FFA502",
      imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=400&auto=format&fit=crop",
    },
  ];

  const handleMysteryPlate = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    const dishes = [
      { name: "Aunty Kamala's Claypot Jaffna Crab Curry", chef: "Kamala's Hearth", disc: "20% OFF", q: "Curry" },
      { name: "Chef Fatima's Woodfired Dum Biryani", chef: "Fatima's Kitchen", disc: "15% OFF", q: "Biryani" },
      { name: "Grandma Mary's Fresh String Hoppers", chef: "Granny Mary's Table", disc: "25% OFF", q: "Rice" },
      { name: "Dilshan's Crispy Pol Roti & Seeni Sambal", chef: "Village Hearth", disc: "20% OFF", q: "Roti" },
    ];
    const picked = dishes[Math.floor(Math.random() * dishes.length)];
    Alert.alert(
      "🎉 Surprise Chef Plate Unlocked!",
      `Today's Pick: ${picked.name}\nCooked by: ${picked.chef}\nSpecial Discount: ${picked.disc}\n\nWould you like to explore dishes from this kitchen?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Explore Dishes", onPress: () => router.push({ pathname: "/(user)/search", params: { q: picked.q } }) },
      ]
    );
  };

  const handleCategorySelect = (type: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
      router.push({ pathname: "/(user)/search", params: { q: type } });
    }
  };

  const handleShopPress = (shopId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push(`(user)/shops/${shopId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const scrollToShops = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(shopsSectionY - 20, 0),
      animated: true,
    });
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
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ---------- HERO ---------- */}
        <ImageBackground
          source={{ uri: HERO_IMAGE_URL }}
          style={[styles.hero, { minHeight: isNarrow ? 400 : 460 }]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.8)"]}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.heroInner,
              { paddingHorizontal: isNarrow ? 20 : 40 },
            ]}
          >
            {/* Nav bar */}
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

            {/* Hero content block */}
            <View style={{ maxWidth: 680, width: "100%", alignSelf: "center", marginVertical: "auto" }}>
              <View style={styles.heroTextBlock}>
                <Text
                  style={[styles.heroTitle, { fontSize: isNarrow ? 32 : 46, lineHeight: isNarrow ? 38 : 54 }]}
                >
                  Order homemade food{"\n"}near you
                </Text>
                <Text style={styles.heroSubtitle}>
                  Fresh, authentic meals handcrafted by local home cooks, delivered hot to your door.
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
                  activeOpacity={0.85}
                >
                  <Ionicons name="location-sharp" size={20} color="#FF3366" />
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
                  <Text style={styles.orGuestText}>Or continue browsing as guest</Text>
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
          {/* Promo Section */}
          <View style={styles.promoSection}>
            {!isNarrow ? (
              <View style={styles.promoDesktopGrid}>
                {promos.map((promo, i) => (
                  <LinearGradient
                    key={i}
                    colors={promo.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promoCardDesktop}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.promoTitle}>{promo.title}</Text>
                      <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                    </View>
                    <Ionicons name={promo.icon} size={34} color="rgba(255,255,255,0.95)" />
                  </LinearGradient>
                ))}
              </View>
            ) : (
              <>
                <ScrollView
                  ref={promoScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const cardWidth = winW - 40;
                    const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
                    setPromoIndex(index);
                  }}
                >
                  {promos.map((promo, i) => (
                    <LinearGradient
                      key={i}
                      colors={promo.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.promoCard,
                        { width: winW - 40 },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.promoTitle}>{promo.title}</Text>
                        <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                      </View>
                      <Ionicons name={promo.icon} size={32} color="rgba(255,255,255,0.95)" />
                    </LinearGradient>
                  ))}
                </ScrollView>
                <View style={styles.promoDots}>
                  {promos.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.promoDot,
                        i === promoIndex && styles.promoDotActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Trust stats bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, { backgroundColor: "#FFF0F5" }]}>
                <Ionicons name="bag-check" size={20} color="#FF3366" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>Orders delivered</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, { backgroundColor: "#EBF5FB" }]}>
                <Ionicons name="storefront" size={20} color="#3498DB" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>Home sellers</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, { backgroundColor: "#FEF9E7" }]}>
                <Ionicons name="star" size={20} color="#F39C12" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>4.8★</Text>
                <Text style={styles.statLabel}>Average rating</Text>
              </View>
            </View>
          </View>

          {/* Curated Highlights / Quick Action Collections */}
          <View style={styles.curatedSection}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeading}>What are you craving today?</Text>
              <Text style={styles.sectionSubheading}>Handcrafted homemade specials ready for you</Text>
            </View>
            <View style={[styles.curatedGrid, isNarrow && styles.curatedGridMobile]}>
              {[
                {
                  id: "fast",
                  title: "Fast Delivery",
                  subtitle: "Under 35 mins",
                  query: "Fast",
                  colors: ["#FF6B6B", "#EE5253"] as const,
                  icon: "flash" as const,
                },
                {
                  id: "top-rated",
                  title: "Top Home Chefs",
                  subtitle: "4.8★ & Verified",
                  query: "Top",
                  colors: ["#FFA502", "#FF7F50"] as const,
                  icon: "ribbon" as const,
                },
                {
                  id: "combos",
                  title: "Daily Specials",
                  subtitle: "Authentic packs",
                  query: "Rice",
                  colors: ["#10AC84", "#1DD1A1"] as const,
                  icon: "restaurant" as const,
                },
                {
                  id: "budget",
                  title: "Budget Bites",
                  subtitle: "Under LKR 800",
                  query: "Budget",
                  colors: ["#5F27CD", "#341F97"] as const,
                  icon: "pricetag" as const,
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.curatedCard}
                  onPress={() => router.push({ pathname: "/(user)/search", params: { q: item.query } })}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.curatedCardGradient}
                  >
                    <View style={styles.curatedCardText}>
                      <Text style={styles.curatedCardTitle}>{item.title}</Text>
                      <Text style={styles.curatedCardSubtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.curatedCardIconBadge}>
                      <Ionicons name={item.icon} size={20} color="#fff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Unique Feature 1: Live Kitchen Batches (Simmering Now) */}
          <View style={styles.liveBatchesSection}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.livePulseDot} />
                <Text style={styles.sectionTitle}>Live Kitchen Batches</Text>
              </View>
              <View style={styles.liveBadgePill}>
                <Text style={styles.liveBadgeText}>Simmering in your area</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {liveBatches.map((batch) => (
                <View key={batch.id} style={styles.liveBatchCard}>
                  <Image source={{ uri: batch.imageUrl }} style={styles.liveBatchImage} />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    style={styles.liveBatchImageGradient}
                  />

                  {/* Status Badges */}
                  <View style={styles.liveBatchTopRow}>
                    <View style={[styles.liveStatusBadge, { backgroundColor: batch.badgeColor }]}>
                      <Text style={styles.liveStatusBadgeText}>{batch.status}</Text>
                    </View>
                    <View style={styles.readyTimeBadge}>
                      <Ionicons name="time-outline" size={12} color="#fff" />
                      <Text style={styles.readyTimeText}>{batch.readyTime}</Text>
                    </View>
                  </View>

                  <View style={styles.liveBatchInfo}>
                    <View style={styles.portionsLeftBadge}>
                      <Text style={styles.portionsLeftText}>🔥 Only {batch.portionsLeft} portions left</Text>
                    </View>
                    <Text style={styles.liveBatchDishName} numberOfLines={1}>{batch.dishName}</Text>
                    <Text style={styles.liveBatchChefName}>by {batch.chefName} • {batch.rating}</Text>
                    <View style={styles.liveBatchFooter}>
                      <Text style={styles.liveBatchPrice}>{batch.price}</Text>
                      <TouchableOpacity
                        style={styles.reserveBtn}
                        onPress={() => router.push({ pathname: "/(user)/search", params: { q: batch.dishName.split(" ")[0] } })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reserveBtnText}>Reserve Pot</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Unified Cuisine & Category Hub */}
          <View style={styles.categorySection}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="restaurant-outline" size={20} color="#FF3366" />
                <Text style={styles.sectionTitle}>Explore Categories</Text>
              </View>
              {selectedType && (
                <TouchableOpacity onPress={() => setSelectedType(null)} style={styles.clearFilterBtn}>
                  <Text style={styles.clearFilterText}>Reset filter</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category Cards Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryButton,
                    selectedType === cat.name && styles.selectedCategory,
                  ]}
                  onPress={() => handleCategorySelect(cat.name)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.categoryIconWrap,
                      selectedType === cat.name && styles.selectedCategoryIconWrap,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={22}
                      color={selectedType === cat.name ? "#fff" : "#FF3366"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedType === cat.name && styles.selectedCategoryText,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Unique Feature 2: Home Chef Spotlight & Story */}
          <View style={styles.chefSpotlightCard}>
            <LinearGradient
              colors={["#1E293B", "#0F172A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chefSpotlightGradient}
            >
              <View style={styles.chefBadgeRow}>
                <View style={styles.masterChefPill}>
                  <Ionicons name="ribbon" size={14} color="#FFD700" />
                  <Text style={styles.masterChefPillText}>Home Chef Spotlight</Text>
                </View>
                <View style={styles.verifiedKitchenBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                  <Text style={styles.verifiedKitchenText}>Hygiene & Taste Verified</Text>
                </View>
              </View>

              <View style={styles.chefContentRow}>
                <View style={styles.chefAvatarWrap}>
                  <Image
                    source={{ uri: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=400&auto=format&fit=crop" }}
                    style={styles.chefAvatar}
                  />
                  <View style={styles.chefStarBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.chefStarText}>4.9</Text>
                  </View>
                </View>

                <View style={styles.chefDetails}>
                  <Text style={styles.chefName}>Chef Kamala Wijesinghe</Text>
                  <Text style={styles.chefOrigin}>Colombo 03 • 35 Years of Home Cooking</Text>
                  <Text style={styles.chefQuote}>
                    “I slow-cook every pot with natural heirloom spices, claypots, and the same love I feed my family.”
                  </Text>
                </View>
              </View>

              <View style={styles.chefBottomRow}>
                <View style={styles.chefStatsGroup}>
                  <Text style={styles.chefStatItem}>🍲 1,200+ Meals Served</Text>
                  <Text style={styles.chefStatItem}>🏺 Claypot Specialist</Text>
                </View>
                <TouchableOpacity
                  style={styles.exploreKitchenBtn}
                  onPress={() => router.push({ pathname: "/(user)/search", params: { q: "Kamala" } })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.exploreKitchenBtnText}>View Kitchen</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Value Promise Banner */}
          <View style={styles.valuePromiseBar}>
            <View style={styles.valuePromiseItem}>
              <Ionicons name="home" size={16} color="#FF3366" />
              <Text style={styles.valuePromiseText}>100% Home Cooked</Text>
            </View>
            <View style={styles.valuePromiseDot} />
            <View style={styles.valuePromiseItem}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.valuePromiseText}>Verified Kitchens</Text>
            </View>
            <View style={styles.valuePromiseDot} />
            <View style={styles.valuePromiseItem}>
              <Ionicons name="bicycle" size={16} color="#3498DB" />
              <Text style={styles.valuePromiseText}>Fresh & Hot Delivery</Text>
            </View>
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
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Unique Feature 3: Mystery Plate Surprise Banner */}
          <View style={styles.mysterySection}>
            <LinearGradient
              colors={["#FF3366", "#9B59B6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mysteryGradient}
            >
              <View style={styles.mysteryLeft}>
                <View style={styles.mysteryBadge}>
                  <Text style={styles.mysteryBadgeText}>🎁 GAMIFIED SPECIAL</Text>
                </View>
                <Text style={styles.mysteryTitle}>Can't Decide What to Eat?</Text>
                <Text style={styles.mysteryDesc}>
                  Let a neighborhood home chef surprise you with their secret specialty at an extra 20% discount!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.mysteryBtn}
                onPress={handleMysteryPlate}
                activeOpacity={0.88}
              >
                <Ionicons name="dice" size={18} color="#FF3366" />
                <Text style={styles.mysteryBtnText}>Roll Mystery Plate</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Popular This Week Section */}
          <View style={styles.popularSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flame-outline" size={17} color="#FF3366" />
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
                <Ionicons name="flame-outline" size={28} color="#ccc" />
                <Text style={styles.emptyStateText}>Nothing trending yet</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {shops.slice(0, 8).map((shop, index) => (
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
                          size={36}
                          color="#fff"
                        />
                      </View>
                    )}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.6)"]}
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
        </View>
      </ScrollView>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  hero: {
    width: "100%",
    justifyContent: "flex-start",
  },
  heroInner: {
    width: "100%",
    alignSelf: "center",
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 24,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    width: 36,    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  navLogo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  navRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  navIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
    marginLeft: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  signupBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginLeft: 8,
  },
  signupBtnText: {
    color: "#111",
    fontSize: 13,
    fontWeight: "700",
  },
  heroTextBlock: {
    marginTop: 30,
  },
  heroTitle: {
    color: "#fff",
    fontWeight: "800",
    lineHeight: 46,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    marginTop: 10,
  },
  heroSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
  },
  heroAddressField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  heroAddressText: {
    marginLeft: 8,
    color: "#222",
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },
  heroAddressLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  heroAddressLoadingText: {
    marginLeft: 6,
    color: "#666",
    fontSize: 13,
  },
  findFoodBtn: {
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    marginLeft: 10,
  },
  findFoodBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  orGuestText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 14,
    textDecorationLine: "underline",
  },
  contentWrap: {
    width: "100%",
    alignSelf: "center",
  },
  promoSection: {
    marginTop: 32,
    marginBottom: 8,
  },
  promoDesktopGrid: {
    flexDirection: "row",
    gap: 20,
    width: "100%",
  },
  promoCardDesktop: {
    flex: 1,
    borderRadius: 18,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  promoCard: {
    borderRadius: 18,
    padding: 20,
    marginRight: 16,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 94,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  promoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  promoSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    lineHeight: 17,
  },
  promoDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  promoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 4,
  },
  promoDotActive: {
    backgroundColor: "#FF3366",
    width: 20,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginTop: 36,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  statIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  statContent: {
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#EAEAEA",
  },
  curatedSection: {
    marginTop: 36,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  sectionSubheading: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  curatedGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  curatedGridMobile: {
    flexWrap: "wrap",
    gap: 12,
  },
  curatedCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  curatedCardGradient: {
    padding: 16,
    minHeight: 88,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  curatedCardText: {
    flex: 1,
    paddingRight: 6,
  },
  curatedCardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  curatedCardSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 3,
  },
  curatedCardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  liveBatchesSection: {
    marginTop: 36,
    marginBottom: 8,
  },
  livePulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  liveBadgePill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  liveBatchCard: {
    width: 250,
    height: 270,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#111",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  liveBatchImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  liveBatchImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  liveBatchTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  liveStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveStatusBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  readyTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  readyTimeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  liveBatchInfo: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  portionsLeftBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 71, 87, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  portionsLeftText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  liveBatchDishName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  liveBatchChefName: {
    color: "#E2E8F0",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  liveBatchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  liveBatchPrice: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "800",
  },
  reserveBtn: {
    backgroundColor: "#FF3366",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reserveBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  categorySection: {
    marginTop: 36,
    marginBottom: 8,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  clearFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#FFF0F3",
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF3366",
  },
  categoryButton: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    width: 106,
    minHeight: 108,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#EDEDF2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF0F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  selectedCategoryIconWrap: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  selectedCategory: {
    backgroundColor: "#FF3366",
    borderColor: "#FF3366",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#333",
    paddingHorizontal: 2,
  },
  selectedCategoryText: {
    color: "#fff",
  },
  chefSpotlightCard: {
    marginTop: 36,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  chefSpotlightGradient: {
    padding: 22,
  },
  chefBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  masterChefPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
    gap: 6,
  },
  masterChefPillText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "800",
  },
  verifiedKitchenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    gap: 5,
  },
  verifiedKitchenText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  chefContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chefAvatarWrap: {
    position: "relative",
    marginRight: 16,
  },
  chefAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  chefStarBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#FF3366",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  chefStarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  chefDetails: {
    flex: 1,
  },
  chefName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  chefOrigin: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  chefQuote: {
    color: "#E2E8F0",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
    lineHeight: 17,
  },
  chefBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  chefStatsGroup: {
    flexDirection: "row",
    gap: 12,
  },
  chefStatItem: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "600",
  },
  exploreKitchenBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3366",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  exploreKitchenBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  mysterySection: {
    marginTop: 36,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  mysteryGradient: {
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mysteryLeft: {
    flex: 1,
    paddingRight: 16,
  },
  mysteryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  mysteryBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  mysteryTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  mysteryDesc: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  mysteryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mysteryBtnText: {
    color: "#111",
    fontSize: 13,
    fontWeight: "800",
  },
  valuePromiseBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDFDFE",
    borderWidth: 1,
    borderColor: "#F0F0F5",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 28,
    marginBottom: 8,
  },
  valuePromiseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valuePromiseText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  valuePromiseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D8",
    marginHorizontal: 16,
  },
  shopsSection: {
    marginTop: 36,
    marginBottom: 12,
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
    color: "#999",    marginTop: 8,
  },
  shopContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    gap: 14,
  },
  shimmerItem: {
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
    marginBottom: 10,
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
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ToastAndroid,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShop, Product } from "../../../context/shopContext";
import { useCart } from "../../../context/cartContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Linking from "expo-linking";

const { width, height } = Dimensions.get("window");

export default function ShopDetails() {
  const { id } = useLocalSearchParams();
  const { shops, products, fetchProducts, fetchShops } = useShop();
  const { addToCart, cart } = useCart();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapExpandAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Top Navigation Header
  const ShopDetailsHeader = () => {
    const handleGoBack = () => {
      router.back();
    };

    const handleFavorite = () => {
      ToastAndroid.show("Added to favorites!", ToastAndroid.SHORT);
    };

    return (
      <View style={styles.headerContainer}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <View style={styles.navigationBar}>
          <TouchableOpacity onPress={handleGoBack} style={styles.navButton}>
            <Ionicons
              name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
              size={24}
              color="#333"
            />
          </TouchableOpacity>

          <Text style={styles.shopNameHeader} numberOfLines={1}>
            {shop?.businessName || "Shop Details"}
          </Text>

          <TouchableOpacity onPress={handleFavorite} style={styles.navButton}>
            <Feather name="heart" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProducts(), fetchShops()]);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (shops.length > 0 && id) {
      const selectedShop = shops.find((s) => s.uid === id);
      setShop(selectedShop);
    }
  }, [shops, id]);

  useEffect(() => {
    if (products.length > 0 && id) {
      const shopProducts = products.filter(
        (product) => product.sellerId === id
      );
      setFilteredProducts(shopProducts);
      setLoading(false);
    }
  }, [products, id]);

  // Animation effect for map expansion
  useEffect(() => {
    Animated.timing(mapExpandAnimation, {
      toValue: mapExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [mapExpanded]);

  const getCategories = () => {
    const categories = filteredProducts.map(
      (product) => product.type || "Other"
    );
    const uniqueCategories = Array.from(new Set(categories));
    return ["All", ...uniqueCategories];
  };

  const getFilteredProductsByCategory = () => {
    if (selectedCategory === "All") return filteredProducts;
    return filteredProducts.filter(
      (product) => product.type === selectedCategory
    );
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    ToastAndroid.show("Item added to cart!", ToastAndroid.SHORT);
  };

  const toggleMapExpansion = () => {
    setMapExpanded(!mapExpanded);
  };

  const openDirections = () => {
    if (!shop?.location?.latitude || !shop?.location?.longitude) {
      ToastAndroid.show(
        "Location coordinates not available",
        ToastAndroid.SHORT
      );
      return;
    }

    const { latitude, longitude } = shop.location;
    const url = Platform.select({
      ios: `maps://app?saddr=Current+Location&daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });

    Linking.openURL(url as string).catch(() => {
      ToastAndroid.show("Could not open maps application", ToastAndroid.SHORT);
    });
  };

  if (loading || !shop) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  const displayProducts = getFilteredProductsByCategory();
  const categories = getCategories();

  // Default shop location - can be replaced with shop's actual coordinates
  const shopLocation = shop.location || {
    latitude: 6.9271,
    longitude: 79.8612,
  };

  const mapHeight = mapExpandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [160, 300],
  });

  return (
    <SafeAreaView style={styles.container} edges={["right", "left", "top"]}>
      <ShopDetailsHeader />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop Header Image */}
        <View style={styles.headerImageContainer}>
          <Image
            source={{
              uri: shop.photoURL || "https://via.placeholder.com/400x200",
            }}
            style={styles.shopImage}
          />
        </View>

        {/* Shop Info Section */}
        <View style={styles.shopInfoSection}>
          <Text style={styles.shopName}>{shop.businessName}</Text>

          <View style={styles.shopMetaRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#333" />
              <Text style={styles.ratingText}>{shop.rating || "4.5"}</Text>
              <Text style={styles.reviewCount}>(120+ reviews)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.deliveryInfo}>
              <Feather name="clock" size={14} color="#555" />
              <Text style={styles.deliveryText}>30-45 min</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="#555" />
            <Text style={styles.shopAddress}>
              {shop.address || "Location not available"}
            </Text>
          </View>

          {/* Shop Location Map */}
          <View style={styles.mapSectionContainer}>
            <View style={styles.mapSectionHeader}>
              <Text style={styles.mapSectionTitle}>Shop Location</Text>
              <TouchableOpacity
                onPress={toggleMapExpansion}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {mapExpanded ? "Show less" : "Show more"}
                </Text>
                <Feather
                  name={mapExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#333"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </View>

            <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
              <MapView
                provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
                style={styles.map}
                region={{
                  latitude: shopLocation.latitude,
                  longitude: shopLocation.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                zoomEnabled={true}
                scrollEnabled={mapExpanded}
                rotateEnabled={mapExpanded}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: shopLocation.latitude,
                    longitude: shopLocation.longitude,
                  }}
                  title={shop.businessName}
                  description={shop.address}
                >
                  <View style={styles.customMarker}>
                    <View style={styles.markerInner}>
                      <Feather name="home" size={16} color="#fff" />
                    </View>
                    <View style={styles.markerTriangle} />
                  </View>
                </Marker>
              </MapView>

              {mapExpanded && (
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={openDirections}
                >
                  <MaterialIcons name="directions" size={16} color="#fff" />
                  <Text style={styles.directionsButtonText}>Directions</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>

          <View style={styles.shopDescriptionContainer}>
            <Text style={styles.shopDescription}>
              {shop.description ||
                "Authentic homemade meals prepared with fresh ingredients. We specialize in traditional recipes handed down through generations."}
            </Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "All" ? "All Items" : selectedCategory}
          </Text>

          {displayProducts.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <Feather name="package" size={40} color="#ddd" />
              <Text style={styles.noProducts}>No products available</Text>
            </View>
          ) : (
            displayProducts.map((product) => (
              <View key={product.id} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <View>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>
                      {product.description ||
                        "Fresh homemade item made with quality ingredients"}
                    </Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>LKR {product.price}</Text>
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={() => handleAddToCart(product)}
                    >
                      <Feather name="plus" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {product.images && (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.viewCartButton}
          onPress={() => router.push("(user)/cart")}
        >
          <View style={styles.cartCount}>
            <Text style={styles.cartCountText}>{cart.length}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Feather name="chevron-right" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1000,
  },
  navigationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  shopNameHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 16,
  },
  headerImageContainer: {
    height: 220,
  },
  shopImage: {
    width: "100%",
    height: 220,
  },
  scrollContainer: {
    flex: 1,
  },
  shopInfoSection: {
    padding: 16,
    backgroundColor: "#fff",
  },
  shopName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  shopMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: "#777",
    marginLeft: 4,
  },
  divider: {
    height: 16,
    width: 1,
    backgroundColor: "#ddd",
    marginHorizontal: 12,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  shopAddress: {
    fontSize: 13,
    color: "#555",
    marginLeft: 6,
    flex: 1,
  },
  // Map related styles
  mapSectionContainer: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  mapSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  mapSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandButtonText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  mapContainer: {
    width: "100%",
    height: 160,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    alignItems: "center",
  },
  markerInner: {
    backgroundColor: "#333",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#333",
    alignSelf: "center",
    marginTop: -4,
  },
  directionsButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  directionsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
  },
  shopDescriptionContainer: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  shopDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
  },
  categoriesSection: {
    marginTop: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 4,
    marginVertical: 8,
  },
  selectedCategory: {
    backgroundColor: "#333",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  productsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  noProductsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noProducts: {
    fontSize: 16,
    color: "#777",
    marginTop: 12,
  },
  productItem: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    width: width - 140,
  },
  productDescription: {
    fontSize: 13,
    color: "#777",
    marginBottom: 8,
    width: width - 140,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: 12,
  },
  addToCartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  viewCartButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cartCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  cartCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  viewCartText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  bottomSpacing: {
    height: 80,
  },
});

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const API_BASE_URL = "https://local-plates-backend.onrender.com/api";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  sellerId: string;
  sellerName: string;
  type: string;
  available: boolean;
  quantity: number;
  createdAt: any;
  updatedAt: any;
  sellerLocation?: string;
  images?: string[];
  rating?: number;
  diet?: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "sp-1",
    name: "Claypot Jaffna Crab Curry",
    price: 1600,
    description: "Authentic coastal spicy crab curry slow-cooked in a claypot with roasted Jaffna spices and fresh coconut milk.",
    sellerId: "seller-kamala",
    sellerName: "Kamala's Hearth",
    type: "Rice & Curry",
    available: true,
    quantity: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Colombo 03",
    rating: 4.9,
    diet: "Spicy",
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-2",
    name: "Woodfired Dum Chicken Biryani",
    price: 1250,
    description: "Fragrant basmati rice layered with marinated chicken, saffron, mint, and fried onions, served with raita and boiled egg.",
    sellerId: "seller-fatima",
    sellerName: "Fatima's Kitchen",
    type: "Biryani",
    available: true,
    quantity: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Dehiwala",
    rating: 5.0,
    diet: "Halal",
    images: ["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-3",
    name: "Traditional Lamprais Pack",
    price: 1450,
    description: "Dutch Burgher style rice boiled in stock with mixed meat curry, frikkadels, blachan, and seeni sambal wrapped in baked banana leaf.",
    sellerId: "seller-mary",
    sellerName: "Granny Mary's Table",
    type: "Rice & Curry",
    available: true,
    quantity: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Bambalapitiya",
    rating: 4.9,
    diet: "Non-Veg",
    images: ["https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-4",
    name: "Grandma's String Hopper Feast (20 Pcs)",
    price: 750,
    description: "Steaming hot red rice string hoppers with aromatic coconut milk kiri hodi and spicy pol sambal.",
    sellerId: "seller-sunitha",
    sellerName: "Home Flavors",
    type: "Short Eats",
    available: true,
    quantity: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Nugegoda",
    rating: 4.8,
    diet: "Vegetarian",
    images: ["https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-5",
    name: "Handmade Cheesy Smash Burger",
    price: 950,
    description: "Juicy handcrafted beef patty with melted cheddar, caramelized onions, and homemade garlic aioli in toasted brioche buns.",
    sellerId: "seller-dilan",
    sellerName: "Dilan's Grill House",
    type: "Burger",
    available: true,
    quantity: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Mount Lavinia",
    rating: 4.7,
    diet: "Halal",
    images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-6",
    name: "Wood-Fired Margherita Pizza",
    price: 1350,
    description: "Crispy artisan sourdough crust topped with San Marzano tomato sauce, fresh buffalo mozzarella, and basil leaves.",
    sellerId: "seller-mario",
    sellerName: "Nonna's Oven",
    type: "Pizza",
    available: true,
    quantity: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Colombo 07",
    rating: 4.9,
    diet: "Vegetarian",
    images: ["https://images.unsplash.com/photo-1604382355076-af4b0eb60143?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-7",
    name: "Spicy Chicken Kottu Roti",
    price: 850,
    description: "Fresh godamba roti chopped on hot griddle with tender chicken, crisp vegetables, eggs, and fiery curry gravy.",
    sellerId: "seller-ruwan",
    sellerName: "Ruwan's Corner",
    type: "Noodles",
    available: true,
    quantity: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Kollupitiya",
    rating: 4.8,
    diet: "Spicy",
    images: ["https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-8",
    name: "Creamy Watalappam with Cashews",
    price: 450,
    description: "Traditional steamed jaggery and coconut milk pudding spiced with cardamom, nutmeg, and crunchy roasted cashews.",
    sellerId: "seller-fatima",
    sellerName: "Fatima's Kitchen",
    type: "Desserts",
    available: true,
    quantity: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Dehiwala",
    rating: 5.0,
    diet: "Halal",
    images: ["https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop"],
  },
  {
    id: "sp-9",
    name: "Organic Buddha Bowl & Hummus",
    price: 900,
    description: "Roasted chickpeas, quinoa, avocado, edamame, and tahini dressing with fresh garlic hummus.",
    sellerId: "seller-maya",
    sellerName: "Green Bowl Kitchen",
    type: "Healthy",
    available: true,
    quantity: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sellerLocation: "Colombo 05",
    rating: 4.9,
    diet: "Vegan",
    images: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600&auto=format&fit=crop"],
  },
];

const CATEGORIES = [
  "All",
  "Rice & Curry",
  "Biryani",
  "Noodles",
  "Burger",
  "Pizza",
  "Short Eats",
  "Desserts",
  "Healthy",
];

const DIET_FILTERS = [
  { label: "All Diets", emoji: "✨" },
  { label: "Vegetarian", emoji: "🥗" },
  { label: "Vegan", emoji: "🌱" },
  { label: "Halal", emoji: "🌙" },
  { label: "Spicy", emoji: "🌶️" },
];

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Top Rated ★" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
];

export default function SearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { width: winW } = useWindowDimensions();
  const isDesktop = winW >= 700;
  const numColumns = winW >= 1500 ? 4 : winW >= 1100 ? 3 : winW >= 700 ? 2 : 1;
  const gutter = winW >= 1200 ? 32 : winW >= 768 ? 20 : 16;

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(q || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDiet, setSelectedDiet] = useState<string>("All Diets");
  const [selectedSort, setSelectedSort] = useState<string>("recommended");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync searchQuery when URL query param changes
  useEffect(() => {
    if (q) {
      setSearchQuery(q);
      // Check if q matches a category
      const matchCat = CATEGORIES.find(
        (c) => c.toLowerCase() === q.toLowerCase()
      );
      if (matchCat) {
        setSelectedCategory(matchCat);
      }
    }
  }, [q]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          return;
        }
      }
      // If backend is empty or unavailable, use rich sample data
      setProducts(SAMPLE_PRODUCTS);
    } catch (error) {
      console.warn("Backend products fetch failed, using sample items:", error);
      setProducts(SAMPLE_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query) ||
          p.sellerName.toLowerCase().includes(query) ||
          (p.diet && p.diet.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => p.type.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Dietary filter
    if (selectedDiet !== "All Diets") {
      result = result.filter((p) => {
        const textToSearch = `${p.name} ${p.description} ${p.diet || ""}`.toLowerCase();
        return textToSearch.includes(selectedDiet.toLowerCase());
      });
    }

    // Price filter
    if (maxPrice !== null) {
      result = result.filter((p) => p.price <= maxPrice);
    }

    // Sort
    if (selectedSort === "rating") {
      result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (selectedSort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (selectedSort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedDiet, selectedSort, maxPrice]);

  const handleShopPress = (sellerId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push(`/(user)/shops/${sellerId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDiet("All Diets");
    setSelectedSort("recommended");
    setMaxPrice(null);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, isDesktop && { flex: 1, marginHorizontal: 8 }]}
      onPress={() => handleShopPress(item.sellerId)}
      activeOpacity={0.88}
    >
      <View style={styles.productImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="fast-food-outline" size={32} color="#ccc" />
          </View>
        )}
        {item.rating && (
          <View style={styles.cardRatingBadge}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={styles.cardRatingText}>{item.rating}</Text>
          </View>
        )}
      </View>

      <View style={styles.productDetails}>
        <View style={styles.productHeaderRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>LKR {item.price}</Text>
        </View>

        <View style={styles.sellerRow}>
          <Ionicons name="storefront-outline" size={13} color="#666" />
          <Text style={styles.productSeller} numberOfLines={1}>
            {item.sellerName} {item.sellerLocation ? `• ${item.sellerLocation}` : ""}
          </Text>
        </View>

        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.productFooter}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.type}</Text>
          </View>

          <View style={styles.shopBadge}>
            <Text style={styles.shopBadgeText}>Order Now</Text>
            <Ionicons name="arrow-forward" size={12} color="#FF3366" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Menu & Search</Text>
        {(searchQuery || selectedCategory !== "All" || selectedDiet !== "All Diets" || maxPrice !== null) ? (
          <TouchableOpacity onPress={handleClearFilters} style={styles.resetHeaderBtn}>
            <Text style={styles.resetHeaderText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Fully Accessible Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#FF3366" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search homemade dishes, chefs, or ingredients..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section: Categories */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dietary & Sorting Options Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subFilterScroll}
        >
          {/* Dietary Filters */}
          {DIET_FILTERS.map((diet) => (
            <TouchableOpacity
              key={diet.label}
              style={[
                styles.subFilterChip,
                selectedDiet === diet.label && styles.subFilterChipActive,
              ]}
              onPress={() => setSelectedDiet(diet.label)}
              activeOpacity={0.75}
            >
              <Text style={styles.subFilterEmoji}>{diet.emoji}</Text>
              <Text
                style={[
                  styles.subFilterText,
                  selectedDiet === diet.label && styles.subFilterTextActive,
                ]}
              >
                {diet.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Budget Filter */}
          <TouchableOpacity
            style={[
              styles.subFilterChip,
              maxPrice === 1000 && styles.subFilterChipActive,
            ]}
            onPress={() => setMaxPrice(maxPrice === 1000 ? null : 1000)}
            activeOpacity={0.75}
          >
            <Text style={styles.subFilterEmoji}>🏷️</Text>
            <Text
              style={[
                styles.subFilterText,
                maxPrice === 1000 && styles.subFilterTextActive,
              ]}
            >
              Under LKR 1,000
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
          <Text style={styles.loadingText}>Fetching fresh homemade dishes...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          key={numColumns}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.productsList,
            { width: "100%", paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                Showing <Text style={{ fontWeight: "700", color: "#111" }}>{filteredProducts.length}</Text> dishes
              </Text>
              {/* Sort pills */}
              <View style={styles.sortRow}>
                {SORT_OPTIONS.slice(0, 2).map((sort) => (
                  <TouchableOpacity
                    key={sort.id}
                    style={[
                      styles.sortBtn,
                      selectedSort === sort.id && styles.sortBtnActive,
                    ]}
                    onPress={() => setSelectedSort(sort.id)}
                  >
                    <Text
                      style={[
                        styles.sortBtnText,
                        selectedSort === sort.id && styles.sortBtnTextActive,
                      ]}
                    >
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="restaurant-outline" size={48} color="#FF3366" />
          </View>
          <Text style={styles.emptyTitle}>No homemade dishes found</Text>
          <Text style={styles.emptyText}>
            We couldn't find matches for "{searchQuery}". Try selecting another category or clearing filters.
          </Text>
          <TouchableOpacity
            style={styles.resetSearchBtn}
            onPress={handleClearFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.resetSearchBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F2",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  resetHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFF0F3",
  },
  resetHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF3366",
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  clearButton: {
    padding: 6,
  },
  filterSection: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F2",
    paddingBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: "#FF3366",
    borderColor: "#FF3366",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  subFilterScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 6,
  },
  subFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 6,
  },
  subFilterChipActive: {
    backgroundColor: "#FFF0F3",
    borderColor: "#FF3366",
  },
  subFilterEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  subFilterTextActive: {
    color: "#FF3366",
    fontWeight: "700",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  resultsCount: {
    fontSize: 13,
    color: "#6B7280",
  },
  sortRow: {
    flexDirection: "row",
    gap: 6,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortBtnActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  sortBtnTextActive: {
    color: "#fff",
  },
  productsList: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EFEFF4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  productImageContainer: {
    width: 120,
    height: 125,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardRatingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  cardRatingText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  productDetails: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  productHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FF3366",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  productSeller: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  productDescription: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 6,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  categoryPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  shopBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  shopBadgeText: {
    fontSize: 11,
    color: "#FF3366",
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 20,
  },
  resetSearchBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetSearchBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, storage } from "../../../services/firebase";
import { ref, deleteObject } from "firebase/storage";

// Define TypeScript interface for product data
interface ProductData {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
  description?: string;
  images?: string[];
  sellerId: string;
  sellerName?: string;
  sellerLocation?: string;
  createdAt: any; // Using 'any' for Firestore timestamp
  updatedAt: any;
  available: boolean;
}

export default function ProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    if (!user || !user.uid) return;

    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("sellerId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const productsList: ProductData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          name: data.name || "",
          type: data.type || "",
          price: data.price || 0,
          quantity: data.quantity || 0,
          description: data.description,
          images: data.images || [],
          sellerId: data.sellerId,
          sellerName: data.sellerName,
          sellerLocation: data.sellerLocation,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          available: data.available !== undefined ? data.available : true,
        });
      });

      // Sort by most recently created first
      productsList.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setProducts(productsList);
      setFilteredProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Get the product data to delete its images
              const productToDelete = products.find(
                (product) => product.id === productId
              );

              // Delete the document from Firestore
              await deleteDoc(doc(db, "products", productId));

              // Delete associated images from Storage
              if (
                productToDelete?.images &&
                productToDelete.images.length > 0
              ) {
                try {
                  // For each image URL, try to delete the file from storage
                  const deletePromises = productToDelete.images.map(
                    async (imageUrl) => {
                      try {
                        // Extract the path from the URL
                        const urlPath = imageUrl.split("?")[0]; // Remove query parameters
                        const storagePath = urlPath.split("products/")[1];

                        if (storagePath) {
                          const imageRef = ref(
                            storage,
                            `products/${storagePath}`
                          );
                          await deleteObject(imageRef);
                        }
                      } catch (error) {
                        console.error("Error deleting image:", error);
                        // Continue even if one image fails to delete
                      }
                    }
                  );

                  await Promise.all(deletePromises);
                } catch (error) {
                  console.error("Error deleting images:", error);
                  // Continue with product deletion even if image deletion fails
                }
              }

              // Update local state
              const updatedProducts = products.filter(
                (product) => product.id !== productId
              );
              setProducts(updatedProducts);
              setFilteredProducts(updatedProducts);

              Alert.alert("Success", "Product deleted successfully");
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: ProductData }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/(seller)/product/${item.id}`)}
    >
      <View style={styles.productImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="fast-food" size={40} color="#FF3366" />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.productType} numberOfLines={1} ellipsizeMode="tail">
          {item.type}
        </Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>
            LKR {item.price.toLocaleString()}
          </Text>
          <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
        </View>
        {item.images && item.images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>+{item.images.length - 1}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteProduct(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3366" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Products</Text>
        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => router.push("/(seller)/sell")}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/(seller)/sell")}
              >
                <Text style={styles.addButtonText}>ADD PRODUCT</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addProductButton: {
    backgroundColor: "#FF3366",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3366",
  },
  productQuantity: {
    fontSize: 12,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageCountBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginVertical: 12,
  },
  addButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

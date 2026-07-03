import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../../../services/firebase";
import { ref, deleteObject } from "firebase/storage";

// Get screen dimensions
const { width } = Dimensions.get("window");

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

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const productDoc = await getDoc(doc(db, "products", id.toString()));

      if (productDoc.exists()) {
        const productData = productDoc.data();
        setProduct({
          id: productDoc.id,
          ...productData,
          // Ensure all required fields have default values if missing
          name: productData.name || "",
          type: productData.type || "",
          price: productData.price || 0,
          quantity: productData.quantity || 0,
          sellerId: productData.sellerId || "",
          images: productData.images || [],
          available:
            productData.available !== undefined ? productData.available : true,
        } as ProductData);
      } else {
        Alert.alert("Error", "Product not found");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      Alert.alert("Error", "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!product) return;

    try {
      setUpdating(true);

      const newAvailability = !product.available;
      await updateDoc(doc(db, "products", product.id), {
        available: newAvailability,
        updatedAt: new Date(),
      });

      setProduct({ ...product, available: newAvailability });
      Alert.alert(
        "Success",
        `Product is now ${newAvailability ? "available" : "unavailable"}`
      );
    } catch (error) {
      console.error("Error updating product availability:", error);
      Alert.alert("Error", "Failed to update product availability");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;

    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This will also delete all associated images.",
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
              setUpdating(true);

              // Delete associated images from Storage
              if (product.images && product.images.length > 0) {
                try {
                  // For each image URL, try to delete the file from storage
                  const deletePromises = product.images.map(
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
                      } catch (imageError) {
                        console.error("Error deleting image:", imageError);
                        // Continue even if one image fails to delete
                      }
                    }
                  );

                  await Promise.all(deletePromises);
                } catch (imagesError) {
                  console.error("Error deleting images:", imagesError);
                  // Continue with product deletion even if image deletion fails
                }
              }

              // Delete the document from Firestore
              await deleteDoc(doc(db, "products", product.id));
              Alert.alert("Success", "Product deleted successfully");
              router.push("/(seller)/products");
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product");
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = () => {
    // if (!product) return;
    // router.push(`/(seller)/edit-product/${product.id}`);
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF3366" />
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Product Details</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProduct}
          >
            <Ionicons name="create-outline" size={24} color="#FF3366" />
          </TouchableOpacity>
        </View>

        {/* Main Image Display */}
        <View style={styles.imageContainer}>
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[selectedImageIndex] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImageContainer}>
              <Ionicons name="fast-food" size={80} color="#FF3366" />
            </View>
          )}
        </View>

        {/* Image Thumbnails */}
        {product.images && product.images.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {product.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnailWrapper,
                    selectedImageIndex === index && styles.selectedThumbnail,
                  ]}
                  onPress={() => handleSelectImage(index)}
                >
                  <Image source={{ uri: image }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <View
              style={[
                styles.statusBadge,
                product.available
                  ? styles.availableBadge
                  : styles.unavailableBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {product.available ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>

          <Text style={styles.productType}>{product.type}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.priceValue}>
              LKR {product.price.toLocaleString()}
            </Text>
          </View>

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantity Available:</Text>
            <Text style={styles.quantityValue}>{product.quantity}</Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>
              {product.description || "No description provided"}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                product.available
                  ? styles.makeUnavailableButton
                  : styles.makeAvailableButton,
              ]}
              onPress={handleToggleAvailability}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {product.available ? "Mark Unavailable" : "Mark Available"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteProduct}
              disabled={updating}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Delete Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginVertical: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  editButton: {
    padding: 4,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  thumbnailContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  selectedThumbnail: {
    borderColor: "#FF3366",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    padding: 16,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 10,
  },
  availableBadge: {
    backgroundColor: "#e6f7e6",
  },
  unavailableBadge: {
    backgroundColor: "#ffe6e6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  productType: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: "#333",
    width: 100,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF3366",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: "#333",
    width: 100,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  buttonsContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  toggleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  makeAvailableButton: {
    backgroundColor: "#28a745",
  },
  makeUnavailableButton: {
    backgroundColor: "#ffc107",
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

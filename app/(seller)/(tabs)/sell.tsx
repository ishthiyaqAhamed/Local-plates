import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../../../services/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function SellScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [foodName, setFoodName] = useState("");
  const [foodType, setFoodType] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<(ImagePicker.ImagePickerAsset | null)[]>(
    [null, null, null, null]
  );
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateForm = () => {
    if (!foodName.trim()) {
      Alert.alert("Error", "Please enter food name");
      return false;
    }
    if (!foodType.trim()) {
      Alert.alert("Error", "Please enter food type");
      return false;
    }
    if (!price.trim() || isNaN(parseFloat(price))) {
      Alert.alert("Error", "Please enter a valid price");
      return false;
    }
    if (!quantity.trim() || isNaN(parseInt(quantity))) {
      Alert.alert("Error", "Please enter a valid quantity");
      return false;
    }

    // Check if at least one image is selected
    if (!images.some((img) => img !== null)) {
      Alert.alert("Error", "Please select at least one image");
      return false;
    }

    return true;
  };

  const pickImage = async (index: number) => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permission to upload images"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update the images array with the selected image
        const newImages = [...images];
        newImages[index] = result.assets[0];
        setImages(newImages);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadImagesToFirebase = async () => {
    const imageUrls = [];
    const validImages = images.filter((img) => img !== null);
    let uploaded = 0;

    // Loop through all selected images and upload them
    for (const image of validImages) {
      try {
        // Convert image URI to blob
        const response = await fetch(image.uri);
        const blob = await response.blob();

        // Create unique filename
        const filename = `${
          user?.uid ?? "unknown_user"
        }_${Date.now()}_${uploaded}.jpg`;
        const storageRef = ref(storage, `products/${filename}`);

        // Upload to Firebase Storage
        await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadUrl = await getDownloadURL(storageRef);
        imageUrls.push(downloadUrl);

        uploaded++;
        setUploadProgress(Math.floor((uploaded / validImages.length) * 100));
      } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("Failed to upload images. Please try again.");
      }
    }

    return imageUrls;
  };

  const resetForm = () => {
    setFoodName("");
    setFoodType("");
    setPrice("");
    setQuantity("");
    setAbout("");
    setImages([null, null, null, null]);
    setUploadProgress(0);
  };

  const handleSell = async () => {
    if (!validateForm()) return;
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setSubmitting(true);

      // Upload images to Firebase Storage
      const imageUrls = await uploadImagesToFirebase();

      // Add product to Firestore with image URLs
      const productData = {
        name: foodName.trim(),
        type: foodType.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity),
        description: about.trim(),
        images: imageUrls,
        sellerId: user.uid,
        sellerName: user.businessName || user.displayName,
        sellerLocation: user.city || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        available: true,
      };

      await addDoc(collection(db, "products"), productData);

      Alert.alert("Success", "Product added successfully!", [
        {
          text: "Add Another",
          onPress: () => resetForm(),
          style: "default",
        },
        {
          text: "Done",
          //for this I want to go back and refresh the products list
          onPress: () => {
            resetForm(), router.back();
          },

          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to add product. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Sell Food</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name of the food"
            value={foodName}
            onChangeText={setFoodName}
          />

          <TextInput
            style={styles.input}
            placeholder="Food type"
            value={foodType}
            onChangeText={setFoodType}
          />

          <TextInput
            style={styles.input}
            placeholder="Price (LKR)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Quantity available"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="About"
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.imagesTitle}>
            Attach Images (at least one required)
          </Text>
          <View style={styles.imageRow}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => pickImage(index)}
                >
                  {image ? (
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <Ionicons name="image-outline" size={30} color="#ccc" />
                  )}
                </TouchableOpacity>
                {image && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      const newImages = [...images];
                      newImages[index] = null;
                      setImages(newImages);
                    }}
                  >
                    <Ionicons name="close-circle" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {submitting && uploadProgress > 0 && (
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { width: `${uploadProgress}%` }]}
              />
              <Text style={styles.progressText}>
                Uploading: {uploadProgress}%
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.sellButton, submitting && styles.disabledButton]}
            onPress={handleSell}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.sellButtonText}>SELL</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 16,
  },
  closeButtonText: {
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  imagesTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: "row",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  imageContainer: {
    position: "relative",
    marginRight: 8,
    marginBottom: 8,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    zIndex: 10,
  },
  imagePickerButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#4caf50",
    borderRadius: 3,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#555",
  },
  sellButton: {
    backgroundColor: "black",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  sellButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

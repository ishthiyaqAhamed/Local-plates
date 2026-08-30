import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const CLOUDINARY_CLOUD_NAME = "ekhkrbth";
const CLOUDINARY_UPLOAD_PRESET = "local_plates_unsigned";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function BuyerSettingsScreen() {
  const router = useRouter();
  const { user, logout, updateUserProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Password change modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Edit profile modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [province, setProvince] = useState(user?.province || "");
  const [zipCode, setZipCode] = useState(user?.zipCode || "");

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<{ uri: string } | null>(
    null
  );
  const [photoURL, setPhotoURL] = useState(user?.photoURL || null);

  // Initialize profile data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhoneNumber(user.phoneNumber || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setProvince(user.province || "");
      setZipCode(user.zipCode || "");
      setPhotoURL(user.photoURL || null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    if (!newPassword) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);

      Alert.alert("Success", "Password updated successfully");
      setPasswordModalVisible(false);
      resetPasswordFields();
    } catch (error: any) {
      console.error("Change password error:", error);
      Alert.alert("Error", error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const pickProfileImage = async () => {
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePhoto(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadProfilePhoto = async () => {
    if (!profilePhoto || !user) return null;

    try {
      setPhotoUploading(true);

      const formData = new FormData();
      // @ts-ignore - React Native's fetch FormData accepts this shape for file uploads
      formData.append("file", {
        uri: profilePhoto.uri,
        type: "image/jpeg",
        name: `profile_${user.uid}_${Date.now()}.jpg`,
      });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Upload failed");
      }

      setPhotoURL(data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      Alert.alert("Error", "Failed to upload profile photo. Please try again.");
      return null;    } finally {
      setPhotoUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      // Upload profile photo if selected
      let updatedPhotoURL = photoURL;
      if (profilePhoto) {
        updatedPhotoURL = await uploadProfilePhoto();
        if (!updatedPhotoURL) {
          // If photo upload failed but other profile data is valid, continue
          // Otherwise, you might want to stop the update process here
        }
      }

      const updatedProfile = {
        displayName,
        phoneNumber,
        address,
        city,
        province,
        zipCode,
        photoURL: updatedPhotoURL,
      };

      await updateUserProfile(updatedProfile);

      Alert.alert("Success", "Profile updated successfully");
      setProfileModalVisible(false);
      // Reset the selected photo (but keep the URL)
      setProfilePhoto(null);
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToOrders = () => {
    router.push("/(user)/orders");
  };

  const handleNavigateToPayments = () => {
    router.push("/(user)/payments");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Photo Display */}
        <View style={styles.profilePhotoContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
          <Text style={styles.userName}>
            {user?.displayName || user?.email?.split("@")[0] || "User"}
          </Text>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={() => setProfileModalVisible(true)}
          >
            <Text style={styles.changePhotoText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>ACCOUNT</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setProfileModalVisible(true)}
          >
            <Ionicons
              name="person-outline"
              size={22}
              color="#333"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setPasswordModalVisible(true)}
          >
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="#333"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>ACTIVITY</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNavigateToOrders}
          >
            <Ionicons
              name="receipt-outline"
              size={22}
              color="#333"
              style={styles.menuIcon}
            />
            <Text style={styles.menuItemText}>Order History</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.logoutButtonText}>LOGOUT</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              value={currentPassword}
              placeholderTextColor="#C0C0C0"
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              value={newPassword}
              placeholderTextColor="#C0C0C0"
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              value={confirmPassword}
              placeholderTextColor="#C0C0C0"
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setPasswordModalVisible(false);
                  resetPasswordFields();
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            {/* Profile Photo Picker */}
            <View style={styles.photoPickerContainer}>
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto.uri }}
                  style={styles.photoPreview}
                />
              ) : photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPreviewPlaceholder}>
                  <Ionicons name="person" size={50} color="#ccc" />
                </View>
              )}

              <TouchableOpacity
                style={styles.photoPickerButton}
                onPress={pickProfileImage}
                disabled={photoUploading}
              >
                <Text style={styles.photoPickerText}>
                  {photoUploading ? "Uploading..." : "Choose Photo"}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name"
              value={displayName}
              placeholderTextColor="#C0C0C0"
              onChangeText={setDisplayName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              value={phoneNumber}
              placeholderTextColor="#C0C0C0"
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Address"
              value={address}
              placeholderTextColor="#C0C0C0"
              onChangeText={setAddress}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="City"
              value={city}
              placeholderTextColor="#C0C0C0"
              onChangeText={setCity}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Province"
              value={province}
              placeholderTextColor="#C0C0C0"
              onChangeText={setProvince}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Zip Code"
              value={zipCode}
              placeholderTextColor="#C0C0C0"
              onChangeText={setZipCode}
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setProfileModalVisible(false);
                  setProfilePhoto(null); // Reset selected photo
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleUpdateProfile}
                disabled={loading || photoUploading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    right: 16,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "300",
  },
  content: {
    flex: 1,
  },
  profilePhotoContainer: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
      },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  changePhotoButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  changePhotoText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  menuSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 12,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#000",
    borderRadius: 4,
    margin: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  photoPickerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  photoPreviewPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  photoPickerButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  photoPickerText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: "#333",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#FF3366",
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});
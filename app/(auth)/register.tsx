import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Join Local Plates</Text>
        <Text style={styles.subtitle}>
          Discover authentic homemade dishes crafted with love by passionate home chefs.
        </Text>

        {/* User Google Sign-In Card */}
        <View style={styles.userCard}>
          <Text style={styles.cardTitle}>For Food Lovers</Text>
          <Text style={styles.cardDesc}>
            Sign up in one tap using your Google account to order fresh meals, save favorite chefs, and track deliveries.
          </Text>

          <GoogleSignInButton
            text="Continue with Google"
            style={styles.googleBtn}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Seller Registration Card */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerHeader}>
            <View style={styles.sellerIcon}>
              <Ionicons name="restaurant" size={20} color="#FF3366" />
            </View>
            <View style={styles.sellerHeaderText}>
              <Text style={styles.sellerCardTitle}>Become a Seller</Text>
              <Text style={styles.sellerCardSubtitle}>Cook & earn from home</Text>
            </View>
          </View>

          <Text style={styles.cardDesc}>
            Register your home kitchen or food business to list homemade plates and receive orders from local foodies.
          </Text>

          <TouchableOpacity
            style={styles.sellerRegisterButton}
            onPress={() => router.push("/(auth)/seller-register")}
            activeOpacity={0.85}
          >
            <Text style={styles.sellerRegisterButtonText}>REGISTER AS SELLER</Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    padding: 10,
    zIndex: 10,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
    marginTop: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  userCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F2",
    padding: 18,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
  },
  googleBtn: {
    width: "100%",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  sellerCard: {
    width: "100%",
    backgroundColor: "#FFF5F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0E6",
    padding: 18,
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  sellerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE0E6",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerHeaderText: {
    flex: 1,
  },
  sellerCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E11D48",
  },
  sellerCardSubtitle: {
    fontSize: 11,
    color: "#9F1239",
  },
  sellerRegisterButton: {
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  sellerRegisterButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  loginPrompt: {
    fontSize: 13,
    color: "#666",
  },
  loginText: {
    color: "#2196F3",
    fontWeight: "bold",
    fontSize: 13,
  },
});
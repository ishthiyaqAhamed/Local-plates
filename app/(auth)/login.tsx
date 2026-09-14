import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSellerLogin, setIsSellerLogin] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Local Plates</Text>

        <Text style={styles.loginTitle}>
          {isSellerLogin ? "Seller Log in" : "User Log in"}
        </Text>

        {!isSellerLogin && (
          <View style={styles.googleSection}>
            <GoogleSignInButton
              text="Sign in with Google"
              style={styles.googleButton}
              textStyle={styles.googleButtonText}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="••••••••••"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {loading ? "LOGGING IN..." : "LOG IN"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSellerLogin(!isSellerLogin)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSellerLogin ? "← Switch to User Login" : "Are you a seller? Switch to Seller Login →"}
          </Text>
        </TouchableOpacity>

        {isSellerLogin ? (
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>New seller on Local Plates? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/seller-register")}>
              <Text style={styles.registerText}>Register as Seller</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sellerJoinContainer}>
            <Text style={styles.registerPrompt}>Want to sell food on Local Plates? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/seller-register")}>
              <Text style={styles.registerText}>Register as Seller</Text>
            </TouchableOpacity>
          </View>
        )}
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
    maxWidth: 440,
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
    width: 80,
    height: 80,
    marginBottom: 8,
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    color: "#111",
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    alignSelf: "flex-start",
    color: "#222",
  },
  googleSection: {
    width: "100%",
    marginBottom: 10,
  },
  googleButton: {
    marginBottom: 16,
  },
  googleButtonText: {
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
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
    color: "#888",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  button: {
    width: "100%",
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  switchButton: {
    marginTop: 18,
    padding: 6,
  },
  switchText: {
    color: "#FF3366",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
  },
  sellerJoinContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 24,
    alignItems: "center",
  },
  registerPrompt: {
    fontSize: 13,
    color: "#666",
  },
  registerText: {
    color: "#2196F3",
    fontWeight: "700",
    fontSize: 13,
  },
});
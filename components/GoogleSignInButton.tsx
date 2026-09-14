import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export interface GoogleSignInButtonProps {
  text?: string;
  style?: any;
  textStyle?: any;
  onSuccess?: () => void;
}

export function GoogleSignInButton({
  text = "Continue with Google",
  style,
  textStyle,
  onSuccess,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (e: any) {
      console.warn("Google sign-in error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={loading}
    >
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" style={styles.icon} />
        ) : (
          <View style={styles.googleIconContainer}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
          </View>
        )}
        <Text style={[styles.buttonText, textStyle]}>
          {loading ? "Connecting to Google..." : text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default GoogleSignInButton;

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    marginRight: 6,
  },
  buttonText: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 15,
  },
});

import React from "react";
import { View, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#FF3366" style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Sellers go straight to their dashboard
  if (user && user.userType === "seller") {
    return <Redirect href="/(seller)" />;
  }

  // Everyone else (guests AND logged-in users) lands on the browsing home
  return <Redirect href="/(user)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 150,
    height: 150,
  },
});
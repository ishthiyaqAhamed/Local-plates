import React, { useEffect } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // useEffect(() => {
  //   if (!loading) {
  //     if (!loading) {
  //       if (user) {
  //         // Redirect based on user type
  //         if (user.userType === "seller") {
  //           console.log("Redirecting to seller page");
  //           router.replace("/(seller)");
  //         } else if (user.userType === "user") {
  //           console.log("Redirecting to user page");
  //           router.replace("/(user)");
  //         } else {
  //           console.log("Unknown user type:", user.userType);
  //         }
  //       }
  //     }
  //   }
  // }, [user, loading, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Local Plates</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.buttonText}>LOG IN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.darkButton]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={[styles.buttonText, styles.darkButtonText]}>
            REGISTER
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 30,
  },
  buttonContainer: {
    width: "100%",
    position: "absolute",
    bottom: 50,
    paddingHorizontal: 20,
  },
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#000",
    marginVertical: 10,
    alignItems: "center",
  },
  darkButton: {
    backgroundColor: "#000",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  darkButtonText: {
    color: "#fff",
  },
});

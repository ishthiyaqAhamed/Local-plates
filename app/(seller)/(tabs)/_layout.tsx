import React from "react";
import { View, Text } from "react-native";
import { Tabs, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import Entypo from "@expo/vector-icons/Entypo";

export default function SellerLayout() {
  const { user } = useAuth();

  // Protect seller screens to only be accessed by sellers
  if (user?.userType !== "seller") {
    // Optionally redirect to login or show an error
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>You need to be logged in as a seller to access this page.</Text>
      </View>
    );
  }

  return (
    <>
      {/* Define stack routes for non-tab screens */}
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />

      {/* Define tab screens */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#FF3366",
          tabBarInactiveTintColor: "#666",
          tabBarShowLabel: false,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
            height: 60,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Entypo name="home" size={24} color="black" />
            ),
          }}
        />

        <Tabs.Screen
          name="sell"
          options={{
            title: "Sell",
            tabBarIcon: ({ color, size }) => (
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: "#FF3366",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <Ionicons name="add" size={30} color="#fff" />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        {/* Hide these screens from tab bar */}
        <Tabs.Screen
          name="products"
          options={{
            href: null, // This prevents direct navigation to this route from tab bar
          }}
        />
      </Tabs>
    </>
  );
}

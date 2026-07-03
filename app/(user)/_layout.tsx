import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { Redirect } from "expo-router";
import { View, Platform } from "react-native";

export default function UserLayout() {
  const { user, loading } = useAuth();

  // Check if the user is authenticated and is a regular user
  if (!loading && (!user || user.userType !== "user")) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF3366",
        tabBarInactiveTintColor: "#777",
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 60,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E0E0E0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        tabBarShowLabel: false,
        headerShown: false,
        animation: "fade",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name={Platform.OS === 'ios' ? "home-outline" : "home"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name={Platform.OS === 'ios' ? "search-outline" : "search"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#FF3366",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Platform.OS === 'ios' ? 20 : 10,
                shadowColor: "#FF3366",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 8,
                transform: [{ scale: 1.05 }],
              }}
            >
              <Ionicons name="cart" size={30} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name={Platform.OS === 'ios' ? "mail-outline" : "mail"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name={Platform.OS === 'ios' ? "person-outline" : "person"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen
        name="shops/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="confirmation"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
        }}
      />
       <Tabs.Screen
        name="select-location"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="select-location-home"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
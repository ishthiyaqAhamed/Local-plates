import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ShopProvider } from "../context/shopContext";
import { CartProvider } from "../context/cartContext";
import { OrderProvider } from "../context/orderContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <ShopProvider>
            <CartProvider>
              <OrderProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/register" />
              <Stack.Screen name="(auth)/seller-register" />
              <Stack.Screen name="(user)" options={{ animation: "fade" }} />
              <Stack.Screen name="(seller)" options={{ animation: "fade" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              
            </Stack>
            </OrderProvider>
            </CartProvider>
          </ShopProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

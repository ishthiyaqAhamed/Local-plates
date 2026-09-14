import React from "react";
import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function SellerLayout() {
  const { user, loading } = useAuth();

  if (!loading && (!user || user.userType !== "seller")) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="product/[id]" />
    </Stack>
  );
}

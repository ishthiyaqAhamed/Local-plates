// app/select-location.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform } from "react-native";


export default function SelectLocationScreen() {
  const router = useRouter();
  const [region, setRegion] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(coords);
        setMarker({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not fetch location");
      }
    })();
  }, []);

  const handleConfirm = () => {
    if (!marker) return;

    console.log("Selected location:", marker);
   
    router.push({
      pathname: "/(user)/",
      params: {
        lat: marker.latitude.toString(),
        lng: marker.longitude.toString(),
      },
    });
  };

  if (!region) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onPress={(e) => setMarker(e.nativeEvent.coordinate)}
      >
        {marker && (
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      <TouchableOpacity
        onPress={handleConfirm}
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          right: 20,
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Confirm Location</Text>
      </TouchableOpacity>
    </View>
  );
}

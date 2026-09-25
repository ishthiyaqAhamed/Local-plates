import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface UniversalMapProps {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  onCoordinateChange?: (coords: { latitude: number; longitude: number }) => void;
  style?: any;
  interactive?: boolean;
  title?: string;
}

let NativeMapView: any = null;
let NativeMarker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    NativeMapView = Maps.default;
    NativeMarker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn("Native maps import failed:", e);
  }
}

export default function UniversalMap({
  latitude,
  longitude,
  latitudeDelta = 0.015,
  longitudeDelta = 0.015,
  onCoordinateChange,
  style,
  interactive = true,
  title = "Selected Location",
}: UniversalMapProps) {
  if (Platform.OS !== "web" && NativeMapView) {
    return (
      <View style={[styles.container, style]}>
        <NativeMapView
          provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta,
          }}
          onPress={(e: any) => {
            if (interactive && onCoordinateChange) {
              onCoordinateChange(e.nativeEvent.coordinate);
            }
          }}
        >
          {NativeMarker && (
            <NativeMarker
              coordinate={{ latitude, longitude }}
              title={title}
              draggable={interactive}
              onDragEnd={(e: any) => {
                if (interactive && onCoordinateChange) {
                  onCoordinateChange(e.nativeEvent.coordinate);
                }
              }}
            />
          )}
        </NativeMapView>
      </View>
    );
  }

  // Web Fallback: OpenStreetMap Interactive Web View
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.008}%2C${longitude + 0.01}%2C${latitude + 0.008}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <View style={[styles.webContainer, style]}>
      {/* Web iframe */}
      <iframe
        title="Map"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: 12 }}
        src={mapUrl}
        loading="lazy"
      />
      <View style={styles.webOverlayBadge}>
        <Ionicons name="location-sharp" size={16} color="#FF3366" />
        <Text style={styles.webOverlayText}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  webContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  webOverlayBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    gap: 4,
  },
  webOverlayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
});

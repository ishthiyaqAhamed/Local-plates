import * as Location from "expo-location";
import { Platform } from "react-native";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddress {
  address: string;
  city: string;
  province: string;
  zipCode: string;
}

export interface LocationResult {
  coords: Coordinates;
  addressInfo: GeocodedAddress;
  isFallback: boolean;
  errorMessage?: string;
}

// Default fallback location (Colombo, Sri Lanka)
export const DEFAULT_COORDS: Coordinates = {
  latitude: 6.9271,
  longitude: 79.8612,
};

export const DEFAULT_ADDRESS_INFO: GeocodedAddress = {
  address: "Colombo Main Street",
  city: "Colombo",
  province: "Western Province",
  zipCode: "10300",
};

/**
 * Format raw reverse geocode data safely into clean strings
 */
export function formatGeocodeData(
  geo?: Location.LocationGeocodedAddress | null
): GeocodedAddress {
  if (!geo) {
    return { ...DEFAULT_ADDRESS_INFO };
  }

  const parts = [
    geo.streetNumber,
    geo.street || geo.name,
    geo.district || geo.subregion,
  ].filter(
    (item): item is string =>
      Boolean(item) &&
      item !== "null" &&
      item !== "undefined" &&
      item !== "Unnamed Road"
  );

  const streetAddress =
    parts.length > 0
      ? parts.join(", ")
      : geo.name || geo.street || "Main Street";

  const city =
    geo.city ||
    geo.subregion ||
    geo.district ||
    DEFAULT_ADDRESS_INFO.city;

  const province =
    geo.region ||
    geo.country ||
    DEFAULT_ADDRESS_INFO.province;

  const zipCode = geo.postalCode || DEFAULT_ADDRESS_INFO.zipCode;

  return {
    address: streetAddress,
    city,
    province,
    zipCode,
  };
}

/**
 * Reverse geocode coordinates to get address details safely
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress> {
  try {
    const geoDataList = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (geoDataList && geoDataList.length > 0) {
      return formatGeocodeData(geoDataList[0]);
    }
  } catch (err) {
    console.warn("Reverse geocoding error:", err);
  }

  return { ...DEFAULT_ADDRESS_INFO };
}

/**
 * Robustly acquire the device location with multiple fallbacks:
 * 1. Request permission
 * 2. Try getCurrentPositionAsync with balanced accuracy
 * 3. Fallback to getLastKnownPositionAsync
 * 4. Fallback to default coordinates
 */
export async function getCurrentUserLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return {
        coords: DEFAULT_COORDS,
        addressInfo: DEFAULT_ADDRESS_INFO,
        isFallback: true,
        errorMessage: "Location permission denied — using default location",
      };
    }

    // Check if location services are enabled on device
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled && Platform.OS !== "web") {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown?.coords) {
          const addressInfo = await reverseGeocodeCoordinates(
            lastKnown.coords.latitude,
            lastKnown.coords.longitude
          );
          return {
            coords: {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            },
            addressInfo,
            isFallback: false,
          };
        }
      }
    } catch {
      // Ignore isLocationEnabled check errors on unsupported platforms
    }

    let coords: Coordinates | null = null;

    // Try getCurrentPosition with a promise timeout race to prevent freezing
    try {
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy:
          Platform.OS === "android"
            ? Location.Accuracy.Balanced
            : Location.Accuracy.High,
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Location request timed out")), 10000)
      );

      const loc = (await Promise.race([
        positionPromise,
        timeoutPromise,
      ])) as Location.LocationObject | null;

      if (loc?.coords) {
        coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
      }
    } catch (posError) {
      console.warn("getCurrentPositionAsync failed, trying last known position:", posError);
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown?.coords) {
          coords = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
        }
      } catch (lastError) {
        console.warn("getLastKnownPositionAsync also failed:", lastError);
      }
    }

    if (coords) {
      const addressInfo = await reverseGeocodeCoordinates(
        coords.latitude,
        coords.longitude
      );
      return {
        coords,
        addressInfo,
        isFallback: false,
      };
    }

    // If both failed, use default fallback
    return {
      coords: DEFAULT_COORDS,
      addressInfo: DEFAULT_ADDRESS_INFO,
      isFallback: true,
      errorMessage: "Could not detect location — using default location",
    };
  } catch (error: any) {
    console.warn("Error in getCurrentUserLocation:", error);
    return {
      coords: DEFAULT_COORDS,
      addressInfo: DEFAULT_ADDRESS_INFO,
      isFallback: true,
      errorMessage: error?.message || "Location detection failed",
    };
  }
}

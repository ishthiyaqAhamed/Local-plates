import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

export default function SellerRegisterScreen() {
  const router = useRouter();
  const { registerSeller } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isEditingCoordinates, setIsEditingCoordinates] = useState(false);
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const mapRef = useRef<MapView | null>(null);

  const geocodeAddress = async (searchText: string) => {
    setMapLoading(true);
    setLocationConfirmed(false);
    try {
      const apiKey = "AIzaSyByZWs5kON553UAotCdmMtG6XvahfGoe_o"; // Move to env file in prod
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchText
      )}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK") {
        const loc = data.results[0].geometry.location;
        setLatitude(loc.lat);
        setLongitude(loc.lng);

        const formattedAddress = data.results[0].formatted_address;
        console.log("Found address:", formattedAddress);

        mapRef.current?.animateToRegion({
          latitude: loc.lat,
          longitude: loc.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } else {
        Alert.alert("Location Error", "Could not find the specified location. Please try again or adjust the pin manually.");
        setLatitude(null);
        setLongitude(null);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to find location. Please check your connection and try again.");
      setLatitude(null);
      setLongitude(null);
    } finally {
      setMapLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    if (!locationConfirmed) {
      const { coordinate } = event.nativeEvent;
      setLatitude(coordinate.latitude);
      setLongitude(coordinate.longitude);
    }
  };

  const confirmLocation = () => {
    if (latitude && longitude) {
      setLocationConfirmed(true);
      setLatitudeInput(latitude.toString());
      setLongitudeInput(longitude.toString());
      Alert.alert("Location Confirmed", "Your business location has been confirmed.");
    } else {
      Alert.alert("Error", "Please set a valid location first.");
    }
  };

  const editCoordinates = () => {
    setIsEditingCoordinates(true);
    setLocationConfirmed(false);
  };

  const saveCoordinates = () => {
    try {
      const lat = parseFloat(latitudeInput);
      const lng = parseFloat(longitudeInput);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        Alert.alert("Invalid Coordinates", "Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.");
        return;
      }

      setLatitude(lat);
      setLongitude(lng);
      setIsEditingCoordinates(false);
      setLocationConfirmed(true);

      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } catch (error) {
      Alert.alert("Error", "Please enter valid coordinates.");
    }
  };

  const handleSearchLocation = () => {
    if (address && city) {
      geocodeAddress(`${address}, ${city}, ${province}`);
    } else {
      Alert.alert("Missing Information", "Please enter at least an address and city to search for location.");
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();

    if (
      !email ||
      !phone ||
      !password ||
      !confirmPassword ||
      !businessName ||
      !address ||
      !city
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!locationConfirmed) {
      Alert.alert("Location Not Confirmed", "Please confirm your business location on the map before registering.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/[^\d]/g, ""))) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      Alert.alert("Error", "Please enter a valid zip code");
      return;
    }

    setLoading(true);
    try {
      await registerSeller(email, password, {
        phone,
        businessName,
        address,
        city,
        province,
        zipCode,
        displayName: businessName,
        location: {
          latitude,
          longitude
        }
      });
      Alert.alert("Success", "Seller account created successfully", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidContainer}
    >
      <TouchableWithoutFeedback onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Register</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            <Text style={styles.sectionTitle}>BUSINESS DETAILS</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Business Name"
                value={businessName}
                onChangeText={setBusinessName}
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Street Address"
                value={address}
                onChangeText={setAddress}
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <View style={styles.locationInputRow}>
                <TextInput
                  style={[styles.input, { flex: 3, marginRight: 10 }]}
                  placeholder="City"
                  value={city}
                  onChangeText={setCity}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearchLocation}
                  disabled={mapLoading}
                >
                  <Text style={styles.searchButtonText}>Find</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Province"
                value={province}
                onChangeText={setProvince}
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Zip Code"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="number-pad"
                returnKeyType="done"
              />

              <Text style={styles.mapInstructionText}>
                {locationConfirmed
                  ? "Business location confirmed ✓"
                  : latitude && longitude
                    ? "Tap 'Confirm Location' if the pin position is correct, or drag to adjust"
                    : "Fill in your address and tap 'Find' to locate your business"}
              </Text>

              <View style={styles.mapContainer}>
                {mapLoading ? (
                  <View style={styles.mapLoadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.mapLoadingText}>Finding location...</Text>
                  </View>
                ) : latitude && longitude ? (
                  <MapView
                    ref={mapRef}
                    provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                      latitude,
                      longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    onPress={handleMapPress}
                    scrollEnabled={!locationConfirmed}
                    zoomEnabled={!locationConfirmed}
                    rotateEnabled={!locationConfirmed}
                    pitchEnabled={!locationConfirmed}
                  >
                    <Marker
                      coordinate={{ latitude, longitude }}
                      draggable={!locationConfirmed}
                      onDragEnd={(e) => {
                        setLatitude(e.nativeEvent.coordinate.latitude);
                        setLongitude(e.nativeEvent.coordinate.longitude);
                      }}
                      pinColor={locationConfirmed ? "#4CAF50" : "#FF5722"}
                    />
                  </MapView>
                ) : (
                  <View style={styles.emptyMapContainer}>
                    <Text style={styles.emptyMapText}>
                      Enter your address and tap "Find" to locate your business
                    </Text>
                  </View>
                )}
              </View>

              {latitude && longitude && !isEditingCoordinates && (
                <View style={styles.locationButtonContainer}>
                  {!locationConfirmed ? (
                    <TouchableOpacity
                      style={styles.confirmLocationButton}
                      onPress={confirmLocation}
                    >
                      <Text style={styles.confirmLocationButtonText}>Confirm Location</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.editLocationButton}
                      onPress={editCoordinates}
                    >
                      <Text style={styles.editLocationButtonText}>Edit Location</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {isEditingCoordinates && (
                <View style={styles.coordinatesContainer}>
                  <Text style={styles.coordinatesLabel}>Fine-tune your coordinates:</Text>
                  <View style={styles.coordinatesInputRow}>
                    <View style={styles.coordinateInputContainer}>
                      <Text style={styles.coordinateLabel}>Latitude:</Text>
                      <TextInput
                        style={styles.coordinateInput}
                        value={latitudeInput}
                        onChangeText={setLatitudeInput}
                        keyboardType="numeric"
                        placeholder="Latitude"
                      />
                    </View>
                    <View style={styles.coordinateInputContainer}>
                      <Text style={styles.coordinateLabel}>Longitude:</Text>
                      <TextInput
                        style={styles.coordinateInput}
                        value={longitudeInput}
                        onChangeText={setLongitudeInput}
                        keyboardType="numeric"
                        placeholder="Longitude"
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.saveCoordinatesButton}
                    onPress={saveCoordinates}
                  >
                    <Text style={styles.saveCoordinatesButtonText}>Save Coordinates</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.termsText}>
              By signing up, you agree to Photo's{" "}
              <Text style={styles.link}>Terms of Service</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.disabledButton,
                !locationConfirmed && styles.disabledButton
              ]}
              onPress={handleRegister}
              disabled={loading || !locationConfirmed}
            >
              <Text style={styles.buttonText}>
                {loading ? "REGISTERING..." : "REGISTER"}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 80,
    marginBottom: 30,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  searchButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mapInstructionText: {
    marginBottom: 10,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  mapLoadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyMapText: {
    textAlign: 'center',
    color: '#666',
  },
  locationButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  confirmLocationButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  confirmLocationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  editLocationButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  editLocationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  coordinatesContainer: {
    marginTop: 5,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  coordinatesLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: '#555',
  },
  coordinatesInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  coordinateInputContainer: {
    flex: 1,
    marginRight: 5,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  coordinateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
  },
  saveCoordinatesButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveCoordinatesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  termsText: {
    marginVertical: 20,
    textAlign: "center",
  },
  link: {
    color: "#2196F3",
  },
  button: {
    width: "100%",
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 50,
  },
  loginText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
});
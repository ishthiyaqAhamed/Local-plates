import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Alert } from "react-native";
import { useRouter } from "expo-router";

const API_BASE_URL = "https://local-plates-backend.onrender.com/api/auth";
const GOOGLE_CLIENT_ID =
  "246121547978-bp1flso095a1j2oj0fh6t366aig4pf91.apps.googleusercontent.com";
const TOKEN_KEY = "local_plates_token";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  userType: "user" | "seller";
  phoneNumber: string | null;
  photoURL: string | null;
  businessName?: string | null;
  businessType?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  zipCode?: string | null;
  location?: { latitude: number | null; longitude: number | null };
  rating?: number;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerUser: (
    email: string,
    password: string,
    extra?: { phoneNumber?: string; displayName?: string }
  ) => Promise<void>;
  registerSeller: (
    email: string,
    password: string,
    extra: {
      phoneNumber?: string;
      businessName: string;
      businessType?: string;
      address: string;
      city: string;
      province?: string;
      zipCode?: string;
      displayName?: string;
      location?: { latitude: number | null; longitude: number | null };
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Loads Google's Identity Services script once, on web only.
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-identity-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    rehydrateSession();
  }, []);

  async function rehydrateSession() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error("Session rehydrate error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSession(token: string, userData: UserProfile) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  }

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    await saveSession(data.token, data.user);
    router.replace(data.user.userType === "seller" ? "/(seller)" : "/(user)");
  };

  const registerUser = async (
    email: string,
    password: string,
    extra?: { phoneNumber?: string; displayName?: string }
  ) => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...extra }),
    });
    const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
    await saveSession(data.token, data.user);
  };

  const registerSeller = async (
    email: string,
    password: string,
    extra: {
      phoneNumber?: string;
      businessName: string;
      businessType?: string;
      address: string;
      city: string;
      province?: string;
      zipCode?: string;
      displayName?: string;
      location?: { latitude: number | null; longitude: number | null };
    }
  ) => {
    const res = await fetch(`${API_BASE_URL}/register-seller`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    await saveSession(data.token, data.user);
  };

  const loginWithGoogle = async () => {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Not available yet",
        "Google Sign-In on the mobile app needs a bit more setup on our end. Please use the web version for now, or register with email."
      );
      return;
    }

    try {
      await loadGoogleScript();
      const google = (window as any).google;

      await new Promise<void>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const idToken = response.credential;
              const res = await fetch(`${API_BASE_URL}/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Google sign-in failed");
              await saveSession(data.token, data.user);
              router.replace(
                data.user.userType === "seller" ? "/(seller)" : "/(user)"
              );
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });

        google.accounts.id.prompt((notification: any) => {
          if (
            notification.isNotDisplayed?.() ||
            notification.isSkippedMoment?.()
          ) {
            reject(new Error("dismissed"));
          }
        });
      });
    } catch (error: any) {
      if (error?.message !== "dismissed") {
        console.error("Google login error:", error);
        Alert.alert(
          "Sign-in failed",
          "Could not sign in with Google. Please try again."
        );
      }
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Not logged in");

    const res = await fetch(`${API_BASE_URL}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update profile");
    setUser(data.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Not logged in");

    const res = await fetch(`${API_BASE_URL}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to change password");
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        registerUser,
        registerSeller,
        logout,
        updateUserProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
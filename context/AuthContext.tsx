import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../services/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { router } from "expo-router";

type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  userType: "seller" | "user" | null;
  phoneNumber: string | null;
  photoURL: string | null;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  businessName?: string;
  businessType?: string;
  rating?: number;
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (
    email: string,
    password: string,
    userData: any
  ) => Promise<void>;
  registerSeller: (
    email: string,
    password: string,
    sellerData: any
  ) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid,
          email: userData.email || null,
          displayName: userData.displayName || null,
          userType: userData.userType || null,
          phoneNumber: userData.phoneNumber || null,
          photoURL: userData.photoURL || null,
          address: userData.address,
          city: userData.city,
          province: userData.province,
          zipCode: userData.zipCode,
          businessName: userData.businessName,
          businessType: userData.businessType,
          rating: userData.rating || 0,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await fetchUserProfile(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // Basic profile if Firestore data is not available
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            userType: null,
            phoneNumber: firebaseUser.phoneNumber,
            photoURL: firebaseUser.photoURL,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (user && user.uid) {
      const refreshedProfile = await fetchUserProfile(user.uid);
      if (refreshedProfile) {
        setUser(refreshedProfile);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        const userProfile = await fetchUserProfile(result.user.uid);
        if (userProfile) {
          if (userProfile.userType === "seller") {
            router.replace("/(seller)");
          }
          if (userProfile.userType === "user") {
            router.replace("/(user)");
          }

        }
        

      }
      
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const registerUser = async (
    email: string,
    password: string,
    userData: any
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // Update display name in Firebase Auth
      if (userData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName,
        });
      }

      // Create user document in Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        displayName: userData.displayName || email.split("@")[0],
        userType: "user",
        phoneNumber: userData.phoneNumber || null,
        photoURL: userData.photoURL || null,
        createdAt: new Date(),
        ...userData,
      });
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const registerSeller = async (
    email: string,
    password: string,
    sellerData: any
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // Update display name in Firebase Auth
      if (sellerData.businessName) {
        await updateProfile(userCredential.user, {
          displayName: sellerData.businessName,
        });
      }

      // Create seller document in Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        displayName: sellerData.businessName || email.split("@")[0],
        userType: "seller",
        phoneNumber: sellerData.phone || null,
        photoURL: sellerData.photoURL || null,
        businessName: sellerData.businessName || null,
        businessType: sellerData.businessType || "Food Seller",
        address: sellerData.address || null,
        city: sellerData.city || null,
        province: sellerData.province || null,
        zipCode: sellerData.zipCode || null,
        rating: 0,
        createdAt: new Date(),
        ...sellerData,
      });
    } catch (error) {
      console.error("Register seller error:", error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !user.uid) {
      throw new Error("No authenticated user found");
    }

    try {
      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        ...data,
        updatedAt: new Date(),
      });

      // Update Auth profile if displayName or photoURL is changing
      if (auth.currentUser && (data.displayName || data.photoURL)) {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName || auth.currentUser.displayName,
          photoURL: data.photoURL || auth.currentUser.photoURL,
        });
      }

      // Update local state
      setUser((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerUser,
        registerSeller,
        updateUserProfile,
        refreshUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

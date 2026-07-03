import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";

interface ShopProfile {
  uid: string;
  businessName: string;
  businessType: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
  email: string;
  rating: number;
  photoURL?: string;
  createdAt?: any;
  userType?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  available: boolean;
  sellerId: string;
  sellerName: string;
  sellerLocation: string;
  type: string;
  images?: string[];
  createdAt: any;
  updatedAt: any;
}

interface ShopContextType {
  shop: ShopProfile | null;
  shops: ShopProfile[];
  products: Product[];
  productTypes: string[];
  loading: boolean;
  updateShopProfile: (data: Partial<ShopProfile>) => Promise<void>;
  refreshShopProfile: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchShops: () => Promise<void>;
  fetchNearShops: (userLat?: number, userLng?: number) => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const shopCollection = collection(db, "users");
      const shopSnapshot = await getDocs(shopCollection);
      const shopList: ShopProfile[] = shopSnapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() } as ShopProfile))
        .filter((shop) => shop.userType === "seller"); // Fetch only sellers

      console.log("Shop List:", shopList);
      setShops(shopList);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsCollection = collection(db, "products");
      const productsSnapshot = await getDocs(productsCollection);
      const productsList: Product[] = productsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(productsList);

      // Extract unique product types
      const uniqueTypes = Array.from(
        new Set(productsList.map((product) => product.type))
      );
      setProductTypes(uniqueTypes);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchShopProfile = async (uid: string): Promise<ShopProfile | null> => {
    try {
      const shopDoc = await getDoc(doc(db, "users", uid));
      if (shopDoc.exists()) {
        const shopData = shopDoc.data();
        return {
          uid,
          businessName: shopData.businessName || "Unknown Shop",
          businessType: shopData.businessType || "Unknown",
          address: shopData.address || "No address",
          city: shopData.city || "Unknown",
          province: shopData.province || "Unknown",
          zipCode: shopData.zipCode || "00000",
          phone: shopData.phone || "No phone",
          email: shopData.email || "No email",
          rating: shopData.rating || 0,
          photoURL: shopData.images || [],
          createdAt: shopData.createdAt,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching shop profile:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearShops = async (userLat?: number, userLng?: number) => {
    try {
      setLoading(true);
      const shopCollection = collection(db, "users");
      const shopSnapshot = await getDocs(shopCollection);

      const shopList: ShopProfile[] = shopSnapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() } as ShopProfile))
        .filter((shop) => shop.userType === "seller");
      console.log("Shop List:", shopList);

      console.log("User Coordinates:", userLat, userLng);
      console.log("Shop Coordinates:", shopList.map((shop) => shop.location));

      // Filter by 5km if location is available
      const filteredShops =
        userLat && userLng
          ? shopList.filter((shop) => {
              if (!shop.location) return false;
              const dist = haversineDistance(
                userLat,
                userLng,
                shop.location.latitude,
                shop.location.longitude
              );
              return dist <= 5;
            })
          : shopList;

      console.log("Filtered Shops:", filteredShops);

      setShops(filteredShops);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshShopProfile = async () => {
    if (user && user.uid) {
      const refreshedProfile = await fetchShopProfile(user.uid);
      if (refreshedProfile) {
        setShop(refreshedProfile);
      }
    }
  };

  const updateShopProfile = async (data: Partial<ShopProfile>) => {
    if (!user || !user.uid) {
      throw new Error("No authenticated user found");
    }
    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...data,
        updatedAt: new Date(),
      });
      setShop((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.error("Error updating shop profile:", error);
      throw error;
    }
  };

  return (
    <ShopContext.Provider
      value={{
        shop,
        shops,
        products,
        productTypes,
        loading,
        updateShopProfile,
        refreshShopProfile,
        fetchProducts,
        fetchShops,
        fetchNearShops,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};

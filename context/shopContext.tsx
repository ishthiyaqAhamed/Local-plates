import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const API_BASE_URL = "https://local-plates-backend.onrender.com/api";
const TOKEN_KEY = "local_plates_token";

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
      const res = await fetch(`${API_BASE_URL}/shops`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch shops");
      setShops(data.shops);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch products");
      setProducts(data.products);

      const uniqueTypes = Array.from(
        new Set(data.products.map((product: Product) => product.type))
      ) as string[];
      setProductTypes(uniqueTypes);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchShopProfile = async (uid: string): Promise<ShopProfile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/shops/${uid}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.shop;
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
      const res = await fetch(`${API_BASE_URL}/shops`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch shops");

      const shopList: ShopProfile[] = data.shops;

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
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update shop profile");
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
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { useCart } from "./cartContext";

const API_BASE_URL = "https://local-plates-backend.onrender.com/api/orders";
const TOKEN_KEY = "local_plates_token";

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  images?: string[];
}

export interface DeliveryInfo {
  address: string;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
  deliveryType: "Standard" | "Express";
  deliveryCharge: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Order {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  appFee: number;
  deliveryInfo: DeliveryInfo;
  status: OrderStatus;
  paymentType: string;
  paymentStatus: "pending" | "paid";
  createdAt: any;
  updatedAt: any;
}

export interface OrderSummary {
  id: string;
  total: number;
  status: OrderStatus;
  date: Date | any;
  itemCount: number;
}

interface OrderContextType {
  orders: Order[];
  userOrders: OrderSummary[];
  sellerOrders: OrderSummary[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  placeOrder: (
    deliveryInfo: DeliveryInfo,
    paymentType: string
  ) => Promise<string | null>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  getUserOrders: () => Promise<void>;
  getSellerOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

async function authHeaders() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const OrderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { cart, clearCart, getTotalAmount } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userOrders, setUserOrders] = useState<OrderSummary[]>([]);
  const [sellerOrders, setSellerOrders] = useState<OrderSummary[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async (
    deliveryInfo: DeliveryInfo,
    paymentType: string = "Cash on Delivery"
  ): Promise<string | null> => {
    if (!user) {
      setError("User must be logged in to place an order");
      return null;
    }

    if (cart.length === 0) {
      setError("Cart is empty");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        images: item.images || [],
      }));

      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          items: orderItems,
          deliveryInfo,
          paymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      const order: Order = data.order;
      setOrders((prev) => [...prev, order]);
      setCurrentOrder(order);
      clearCart();

      return order.id || null;
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
            return null;
    } finally {
      setLoading(false);
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/${orderId}`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");

      setCurrentOrder(data.order);
      return data.order;
    } catch (err) {
      console.error("Error getting order:", err);
      setError("Failed to get order. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserOrders = async (): Promise<void> => {
    if (!user) {
      setError("User must be logged in to view orders");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/user/me`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders");

      const fetchedOrders: Order[] = data.orders;
      setOrders(fetchedOrders);
      setUserOrders(
        fetchedOrders.map((order) => ({
          id: order.id!,
          total: order.total,
          status: order.status,
          date: order.createdAt,
          itemCount: order.items.length,
        }))
      );
    } catch (err) {
      console.error("Error getting user orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSellerOrders = async (): Promise<void> => {
    if (!user) {
      setError("Seller must be logged in to view orders");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/seller/me`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load seller orders");

      setSellerOrders(data.orders);
    } catch (err) {
      console.error("Error getting seller orders:", err);
      setError("Failed to load seller orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/${orderId}/status`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order status");

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder({ ...currentOrder, status });
      }

      setUserOrders((prevSummaries) =>
        prevSummaries.map((summary) =>
          summary.id === orderId ? { ...summary, status } : summary
        )
      );

      setSellerOrders((prevSummaries) =>
        prevSummaries.map((summary) =>
          summary.id === orderId ? { ...summary, status } : summary
        )
      );
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string): Promise<void> => {
    await updateOrderStatus(orderId, OrderStatus.CANCELLED);
  };

  useEffect(() => {
    if (user) {
      getUserOrders();
    } else {
      setOrders([]);
      setUserOrders([]);
      setSellerOrders([]);
      setCurrentOrder(null);
    }
  }, [user]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        userOrders,
        sellerOrders,
        currentOrder,
        loading,
        error,
        placeOrder,
        getOrderById,
        getUserOrders,
        getSellerOrders,
        updateOrderStatus,
        cancelOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}; 
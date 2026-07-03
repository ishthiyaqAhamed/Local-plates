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
  collection,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentReference,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useCart } from "./cartContext";
import { Product } from "./shopContext";

// Define the order status enum
export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

// Define the order item interface (each product in an order)
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  images?: string[];
}

// Define the delivery information interface
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

// Define the order interface
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

// Define the order summary for UI display
export interface OrderSummary {
  id: string;
  total: number;
  status: OrderStatus;
  date: Date | any;
  itemCount: number;
}

// Define the order context type
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

// Create the order context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Create the order provider component
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

  // Calculate app fee function
  const calculateAppFee = (subtotal: number): number => {
    // Fixed app fee for simplicity
    return 50;
  };

  // Place a new order
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
      // Prepare order items from cart
      const orderItems: OrderItem[] = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        images: item.images || [],
      }));

      // Calculate totals
      const subtotal = getTotalAmount();
      const appFee = calculateAppFee(subtotal);
      const total = subtotal + appFee + deliveryInfo.deliveryCharge;

      // Create the order object
      const newOrder: Omit<Order, "id"> = {
        userId: user.uid,
        userName: user.displayName || "Anonymous User",
        userEmail: user.email || "No email provided",
        items: orderItems,
        subtotal,
        appFee,
        total,
        deliveryInfo,
        status: OrderStatus.PENDING,
        paymentType,
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("New Order:", newOrder);

      // Save the order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), newOrder);

      // Create order-items subcollection to make querying by seller easier
      for (const item of orderItems) {
        await addDoc(collection(db, "orders", orderRef.id, "items"), {
          ...item,
          orderId: orderRef.id,
          orderDate: newOrder.createdAt,
          orderStatus: newOrder.status,
        });
      }

      // Get the newly created order
      const orderWithId: Order = {
        ...newOrder,
        id: orderRef.id,
      };

      // Update state
      setOrders((prevOrders) => [...prevOrders, orderWithId]);
      setCurrentOrder(orderWithId);

      // Clear the cart
      clearCart();

      // Return the order ID
      return orderRef.id;
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get a specific order by ID
  const getOrderById = async (orderId: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);

    try {
      const orderDoc = await getDoc(doc(db, "orders", orderId));

      if (orderDoc.exists()) {
        const orderData = orderDoc.data() as Omit<Order, "id">;
        const order: Order = {
          ...orderData,
          id: orderId,
        };

        setCurrentOrder(order);
        return order;
      }

      setError("Order not found");
      return null;
    } catch (err) {
      console.error("Error getting order:", err);
      setError("Failed to get order. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get all orders for the current user
  const getUserOrders = async (): Promise<void> => {
    if (!user) {
      setError("User must be logged in to view orders");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const fetchedOrders: Order[] = [];
      const fetchedOrderSummaries: OrderSummary[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Order, "id">;
        const order: Order = {
          ...data,
          id: doc.id,
        };

        fetchedOrders.push(order);

        // Create summary for UI
        fetchedOrderSummaries.push({
          id: doc.id,
          total: order.total,
          status: order.status,
          date: order.createdAt,
          itemCount: order.items.length,
        });
      });

      setOrders(fetchedOrders);
      setUserOrders(fetchedOrderSummaries);
    } catch (err) {
      console.error("Error getting user orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get all orders for the current seller
  const getSellerOrders = async (): Promise<void> => {
    if (!user) {
      setError("Seller must be logged in to view orders");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all orders
      const ordersRef = collection(db, "orders");
      const querySnapshot = await getDocs(ordersRef);
      const fetchedSellerOrders: OrderSummary[] = [];

      // Process each order document
      for (const doc of querySnapshot.docs) {
        const orderData = doc.data() as Omit<Order, "id">;

        // Check if any items in this order belong to the current seller
        const sellerItems = orderData.items.filter(
          (item) => item.sellerId === user.uid
        );

        // If this order contains items from the current seller
        if (sellerItems.length > 0) {
          // Calculate total for only this seller's items
          const sellerTotal = sellerItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          // Create an order summary for the seller's view
          fetchedSellerOrders.push({
            id: doc.id,
            total: sellerTotal,
            status: orderData.status,
            date: orderData.createdAt,
            itemCount: sellerItems.length,
          });
        }
      }

      // Sort orders by date (newest first)
      fetchedSellerOrders.sort((a, b) => {
        // Convert Firebase timestamps to JS Date objects if needed
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setSellerOrders(fetchedSellerOrders);
    } catch (err) {
      console.error("Error getting seller orders:", err);
      setError("Failed to load seller orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the status of an order
  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder({ ...currentOrder, status });
      }

      // Update order summary lists
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

  // Cancel an order
  const cancelOrder = async (orderId: string): Promise<void> => {
    await updateOrderStatus(orderId, OrderStatus.CANCELLED);
  };

  // Load user orders when user changes
  useEffect(() => {
    if (user) {
      getUserOrders();
    } else {
      // Clear orders when user logs out
      setOrders([]);
      setUserOrders([]);
      setSellerOrders([]);
      setCurrentOrder(null);
    }
  }, [user]);

  // Provide the context
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

// Create the useOrder hook
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};

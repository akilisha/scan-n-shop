import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Product } from "@/types";
import { useDemo } from "@/contexts/DemoContext";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Access demo context safely
  let demoCartItems: CartItem[] = [];
  let isDemoMode = false;
  try {
    const demo = useDemo();
    demoCartItems = demo?.demoCartItems || [];
    isDemoMode = demo?.isDemoMode || false;
  } catch {
    // Demo context not available, continue normally
  }

  // Use demo cart when in demo mode, otherwise use real cart
  const effectiveCartItems = isDemoMode ? demoCartItems : cartItems;

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error("Failed to parse saved cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(
      (item) => item.product.id === product.id,
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        product,
        quantity: 1,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return effectiveCartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = () => {
    return effectiveCartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const tax = subtotal * 0.08; // 8% tax
    return subtotal + tax;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: effectiveCartItems,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        getTotalItems,
        getSubtotal,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

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
  let addDemoItem: ((productId: string) => void) | undefined;
  let updateDemoQuantity:
    | ((itemId: string, newQuantity: number) => void)
    | undefined;
  let removeDemoItem: ((itemId: string) => void) | undefined;
  let clearDemoCart: (() => void) | undefined;

  try {
    const demo = useDemo();
    if (demo) {
      demoCartItems = demo.demoCartItems || [];
      isDemoMode = demo.isDemoMode || false;
      addDemoItem = demo.addDemoItem;
      updateDemoQuantity = demo.updateDemoQuantity;
      removeDemoItem = demo.removeDemoItem;
      clearDemoCart = demo.clearDemoCart;
    }
  } catch {
    // Demo context not available, continue normally
    isDemoMode = false;
    demoCartItems = [];
  }

  // Use demo cart when in demo mode, otherwise use real cart
  const effectiveCartItems =
    isDemoMode && demoCartItems.length >= 0 ? demoCartItems : cartItems;

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
    // If in demo mode, use demo cart operations
    if (isDemoMode && addDemoItem) {
      addDemoItem(product.id);
      return;
    }

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
    // If in demo mode, use demo cart operations
    if (isDemoMode && updateDemoQuantity) {
      updateDemoQuantity(itemId, newQuantity);
      return;
    }

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
    // If in demo mode, use demo cart operations
    if (isDemoMode && removeDemoItem) {
      removeDemoItem(itemId);
      return;
    }

    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    // If in demo mode, use demo cart operations
    if (isDemoMode && clearDemoCart) {
      clearDemoCart();
      return;
    }

    setCartItems([]);
  };

  const getTotalItems = () => {
    // Ensure we have a valid array before reducing
    const items = effectiveCartItems || [];
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
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

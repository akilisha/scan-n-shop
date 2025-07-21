import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, User } from "@/types";

interface DemoContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  demoUser: User | null;
  demoCartItems: CartItem[];
  addDemoItem: (productId: string) => void;
  updateDemoQuantity: (itemId: string, newQuantity: number) => void;
  removeDemoItem: (itemId: string) => void;
  clearDemoCart: () => void;
  showDemoButton: boolean;
  hideDemoButton: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDemoButton, setShowDemoButton] = useState(true);
  const [demoCartItems, setDemoCartItems] = useState<CartItem[]>([]);

  // Create a demo user with limited seller access
  const demoUser: User = {
    id: "demo-user",
    email: "demo@example.com",
    name: "Demo User",
    preferences: {
      notifications: { email: true, push: true, sms: false },
      currency: "USD",
      language: "English",
      darkMode: false,
    },
    hasSellerAccess: true, // Give demo user seller access to showcase features
  };

  // Load demo button visibility from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem("demoDismissed");
    if (dismissed === "true") {
      setShowDemoButton(false);
    }
  }, []);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    // No demo items - keep cart empty in demo mode
    const demoItems: CartItem[] = [];
    setDemoCartItems(demoItems);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoCartItems([]);
  };

  const addDemoItem = (productId: string) => {
    // No demo products available - this function is disabled
    return;

    const existingItem = demoCartItems.find(
      (item) => item.product.id === productId,
    );
    if (existingItem) {
      setDemoCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      const newItem: CartItem = {
        id: `demo-${Date.now()}`,
        product,
        quantity: 1,
      };
      setDemoCartItems((prev) => [...prev, newItem]);
    }
  };

  const updateDemoQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeDemoItem(itemId);
      return;
    }
    setDemoCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeDemoItem = (itemId: string) => {
    setDemoCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearDemoCart = () => {
    setDemoCartItems([]);
  };

  const hideDemoButton = () => {
    setShowDemoButton(false);
    localStorage.setItem("demoDismissed", "true");
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        demoUser: isDemoMode ? demoUser : null,
        demoCartItems,
        addDemoItem,
        updateDemoQuantity,
        removeDemoItem,
        clearDemoCart,
        showDemoButton,
        hideDemoButton,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}

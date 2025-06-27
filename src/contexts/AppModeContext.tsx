import React, { createContext, useContext, useState, useEffect } from "react";
import { AppMode, User } from "@/types";
import { useDemo } from "@/contexts/DemoContext";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  canAccessSellerMode: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("buyer");
  const [user, setUser] = useState<User | null>(null);

  // Access demo context safely
  let demoUser = null;
  let isDemoMode = false;
  try {
    const demo = useDemo();
    demoUser = demo?.demoUser;
    isDemoMode = demo?.isDemoMode || false;
  } catch {
    // Demo context not available, continue normally
  }

  // Use demo user when in demo mode, otherwise use real user
  const effectiveUser = isDemoMode ? demoUser : user;

  // Check seller access based on user subscriptions
  const canAccessSellerMode = effectiveUser?.hasSellerAccess || false;

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
      }
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Reset to buyer mode if user loses seller access
  useEffect(() => {
    if (mode === "seller" && !canAccessSellerMode) {
      setMode("buyer");
    }
  }, [mode, canAccessSellerMode]);

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode,
        canAccessSellerMode,
        user: effectiveUser,
        setUser,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
}

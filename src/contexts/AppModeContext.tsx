import React, { createContext, useContext, useState, useEffect } from "react";
import { AppMode, User } from "@/types";

import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  canAccessSellerMode: boolean;
  user: User | null;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("buyer");

  // Get user from Supabase auth
  const { user: supabaseUser } = useSupabaseAuth();

  // Always use real Supabase user
  const effectiveUser = supabaseUser;

  // Check seller access based on user subscriptions
  // Only allow seller access if they have completed the subscription flow
  const canAccessSellerMode = effectiveUser?.hasSellerAccess;

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

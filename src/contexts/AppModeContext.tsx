import React, { createContext, useContext, useState } from "react";
import { AppMode, User } from "@/types";
import { useDemo } from "@/contexts/DemoContext";
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

  // Use demo user when in demo mode, otherwise use Supabase user
  const effectiveUser = isDemoMode ? demoUser : supabaseUser;

  // Check seller access based on user subscriptions
  const canAccessSellerMode = effectiveUser?.hasSellerAccess || false;

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

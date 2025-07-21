import React, { createContext, useContext, useState, useEffect } from "react";
import { PaymentMethod } from "@/types";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useDemo } from "@/contexts/DemoContext";
import {
  getUserPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} from "@/lib/supabase";

interface PaymentMethodsContextType {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  addUserPaymentMethod: (
    paymentMethod: Omit<PaymentMethod, "id">,
  ) => Promise<{ error: any }>;
  setUserDefaultPaymentMethod: (id: string) => Promise<{ error: any }>;
  deleteUserPaymentMethod: (id: string) => Promise<{ error: any }>;
  refreshPaymentMethods: () => Promise<void>;
}

const PaymentMethodsContext = createContext<
  PaymentMethodsContextType | undefined
>(undefined);

export function PaymentMethodsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabaseUser } = useSupabaseAuth();
  const { isDemoMode } = useDemo();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  // Use mock data only in demo mode AND when user is not authenticated
  // Never show mock data for authenticated users
  const effectivePaymentMethods = supabaseUser
    ? paymentMethods
    : isDemoMode
      ? mockPaymentMethods
      : paymentMethods;

  useEffect(() => {
    if (supabaseUser && !isDemoMode) {
      loadUserPaymentMethods();
    } else if (!supabaseUser) {
      // Clear payment methods when user logs out
      setPaymentMethods([]);
    }
  }, [supabaseUser, isDemoMode]);

  const loadUserPaymentMethods = async () => {
    if (!supabaseUser) return;

    setLoading(true);
    try {
      const { data, error } = await getUserPaymentMethods(supabaseUser.id);

      if (error) {
        console.error("Error loading payment methods:", error);
        return;
      }

      // Convert database format to app format
      const convertedMethods: PaymentMethod[] = (data || []).map((method) => ({
        id: method.id,
        type: method.type as "card",
        last4: method.last4,
        brand: method.brand,
        expiryMonth: method.expiry_month,
        expiryYear: method.expiry_year,
        isDefault: method.is_default,
        nickname:
          method.nickname ||
          `${method.brand.toUpperCase()} ••••${method.last4}`,
      }));

      setPaymentMethods(convertedMethods);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUserPaymentMethod = async (
    paymentMethod: Omit<PaymentMethod, "id">,
  ) => {
    if (!supabaseUser || isDemoMode) {
      return { error: { message: "User not authenticated" } };
    }

    setLoading(true);
    try {
      const { data, error } = await addPaymentMethod(supabaseUser.id, {
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        brand: paymentMethod.brand,
        expiry_month: paymentMethod.expiryMonth,
        expiry_year: paymentMethod.expiryYear,
        nickname: paymentMethod.nickname,
        is_default: paymentMethod.isDefault,
      });

      if (error) {
        return { error };
      }

      // Refresh the list
      await loadUserPaymentMethods();
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const setUserDefaultPaymentMethod = async (id: string) => {
    if (!supabaseUser || isDemoMode) {
      return { error: { message: "User not authenticated" } };
    }

    setLoading(true);
    try {
      const { error } = await setDefaultPaymentMethod(supabaseUser.id, id);

      if (error) {
        return { error };
      }

      // Refresh the list
      await loadUserPaymentMethods();
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const deleteUserPaymentMethod = async (id: string) => {
    if (!supabaseUser || isDemoMode) {
      return { error: { message: "User not authenticated" } };
    }

    setLoading(true);
    try {
      const { error } = await deletePaymentMethod(supabaseUser.id, id);

      if (error) {
        return { error };
      }

      // Refresh the list
      await loadUserPaymentMethods();
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const refreshPaymentMethods = async () => {
    if (supabaseUser && !isDemoMode) {
      await loadUserPaymentMethods();
    }
  };

  return (
    <PaymentMethodsContext.Provider
      value={{
        paymentMethods: effectivePaymentMethods,
        loading,
        addUserPaymentMethod,
        setUserDefaultPaymentMethod,
        deleteUserPaymentMethod,
        refreshPaymentMethods,
      }}
    >
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export function usePaymentMethods() {
  const context = useContext(PaymentMethodsContext);
  if (context === undefined) {
    throw new Error(
      "usePaymentMethods must be used within a PaymentMethodsProvider",
    );
  }
  return context;
}

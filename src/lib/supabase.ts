import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database type definitions
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          has_seller_access: boolean;
          seller_plan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          has_seller_access?: boolean;
          seller_plan?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          has_seller_access?: boolean;
          seller_plan?: string | null;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          description: string;
          price: number;
          image_url: string | null;
          category: string;
          in_stock: boolean;
          barcode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          name: string;
          description: string;
          price: number;
          image_url?: string | null;
          category: string;
          in_stock?: boolean;
          barcode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          name?: string;
          description?: string;
          price?: number;
          image_url?: string | null;
          category?: string;
          in_stock?: boolean;
          barcode?: string | null;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          total_amount: number;
          payment_method: any; // JSON
          items: any; // JSON
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status: string;
          total_amount: number;
          payment_method: any;
          items: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          total_amount?: number;
          payment_method?: any;
          items?: any;
          updated_at?: string;
        };
      };
    };
  };
}

// Auth helpers
export const signUp = async (
  email: string,
  password: string,
  fullName: string,
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

export const updateProfile = async (updates: {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No user found");

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  return { data, error };
};

// Profile helpers
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
};

export const createProfile = async (user: any) => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    })
    .select()
    .single();

  return { data, error };
};

// Payment Methods functions
export const getUserPaymentMethods = async (userId: string) => {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const addPaymentMethod = async (
  userId: string,
  paymentMethod: {
    type: string;
    last4: string;
    brand: string;
    expiry_month: number;
    expiry_year: number;
    nickname?: string;
    is_default?: boolean;
  },
) => {
  // If this is the first payment method, make it default
  const { data: existingMethods } = await getUserPaymentMethods(userId);
  const isFirstMethod = !existingMethods || existingMethods.length === 0;

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({
      user_id: userId,
      ...paymentMethod,
      is_default: isFirstMethod || paymentMethod.is_default,
    })
    .select()
    .single();

  return { data, error };
};

export const setDefaultPaymentMethod = async (
  userId: string,
  paymentMethodId: string,
) => {
  // First, set all payment methods to non-default
  await supabase
    .from("payment_methods")
    .update({ is_default: false })
    .eq("user_id", userId);

  // Then set the selected one as default
  const { data, error } = await supabase
    .from("payment_methods")
    .update({ is_default: true })
    .eq("id", paymentMethodId)
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
};

export const deletePaymentMethod = async (
  userId: string,
  paymentMethodId: string,
) => {
  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", paymentMethodId)
    .eq("user_id", userId);

  return { error };
};

// Orders functions
export const createOrder = async (
  userId: string,
  order: {
    total_amount: number;
    payment_method: any;
    items: any;
    status?: string;
  },
) => {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: order.status || "completed",
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      items: order.items,
    })
    .select()
    .single();

  return { data, error };
};

export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};

// Subscription management functions
export const createSubscription = async (
  userId: string,
  subscriptionData: {
    plan_id: string;
    plan_name: string;
    price: number;
    interval: "month" | "year";
    current_period_end: string;
  },
) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      ...subscriptionData,
    })
    .select()
    .single();

  return { data, error };
};

export const getUserSubscriptions = async (userId: string) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const updateSubscriptionStatus = async (
  subscriptionId: string,
  status: string,
) => {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "canceled") {
    updates.canceled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(updates)
    .eq("id", subscriptionId)
    .select()
    .single();

  return { data, error };
};

export const getActiveSellerSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("current_period_end", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error };
};

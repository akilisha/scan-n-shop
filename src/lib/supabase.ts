import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL format and provide fallback for development
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isDevelopmentFallback =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your_supabase_project_url_here") ||
  supabaseAnonKey.includes("your_supabase_anon_key_here") ||
  !isValidUrl(supabaseUrl);

if (isDevelopmentFallback) {
  console.warn("⚠️  Using fallback Supabase configuration for development");
  console.warn(
    "   Add real Supabase credentials to .env for full functionality",
  );
  console.warn("   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

// Use fallback values for development to prevent crashes
const finalUrl = isDevelopmentFallback
  ? "https://demo.supabase.co"
  : supabaseUrl;

const finalKey = isDevelopmentFallback
  ? "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTU2NzAxMCwiZXhwIjoxOTYxMTQzMDEwfQ.demo"
  : supabaseAnonKey;

// Export flag for other components to know if we're using fallback credentials
export const isUsingFallbackCredentials = isDevelopmentFallback;

export const supabase = createClient(finalUrl, finalKey, {
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

// =============================================================================
// LOCATION-BASED MARKETPLACE FUNCTIONS
// =============================================================================

// Event management functions
export const createEvent = async (
  userId: string,
  eventData: {
    title: string;
    description: string;
    event_type: string;
    latitude: number;
    longitude: number;
    location_name: string;
    address?: string;
    search_radius?: number;
    start_date: string;
    end_date?: string;
    is_recurring?: boolean;
    recurrence_pattern?: string;
    max_participants?: number;
    entry_fee?: number;
    contact_phone?: string;
    contact_email?: string;
    special_instructions?: string;
    tags?: string[];
    images?: string[];
    status?: string;
  },
) => {
  const { data, error } = await supabase
    .from("events")
    .insert({
      seller_id: userId,
      ...eventData,
    })
    .select()
    .single();

  return { data, error };
};

export const updateEvent = async (eventId: string, updates: any) => {
  const { data, error } = await supabase
    .from("events")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select()
    .single();

  return { data, error };
};

export const getUserEvents = async (userId: string) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("seller_id", userId)
    .order("start_date", { ascending: false });

  return { data, error };
};

export const getEvent = async (eventId: string) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  return { data, error };
};

export const deleteEvent = async (eventId: string) => {
  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  return { data, error };
};

// Product location functions
export const updateProductLocation = async (
  productId: string,
  locationData: {
    latitude: number;
    longitude: number;
    location_name?: string;
    address?: string;
    search_radius?: number;
    zip_code?: string;
    is_pickup_only?: boolean;
    is_delivery_available?: boolean;
    delivery_radius?: number;
  },
) => {
  const { data, error } = await supabase
    .from("products")
    .update({
      ...locationData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  return { data, error };
};

// Proximity search functions
export const searchNearbyProducts = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  filters: {
    query?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    limit?: number;
  } = {},
) => {
  let query = supabase
    .from("products")
    .select("*, profiles:seller_id(full_name)")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  // Add text search if query provided
  if (filters.query) {
    query = query.or(
      `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`,
    );
  }

  // Add category filter
  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  // Add price filters
  if (filters.priceMin !== undefined) {
    query = query.gte("price", filters.priceMin);
  }
  if (filters.priceMax !== undefined) {
    query = query.lte("price", filters.priceMax);
  }

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Calculate distances and filter by radius
  const productsWithDistance = data
    ?.map((product: any) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        product.latitude,
        product.longitude,
      );
      return { ...product, distance };
    })
    .filter((product: any) => product.distance <= radiusKm)
    .sort((a: any, b: any) => a.distance - b.distance);

  return { data: productsWithDistance, error: null };
};

export const searchNearbyEvents = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 15,
  filters: {
    query?: string;
    eventType?: string;
    timeFrame?: string;
    limit?: number;
  } = {},
) => {
  let query = supabase
    .from("events")
    .select("*, profiles:seller_id(full_name)")
    .eq("status", "active");

  // Add text search if query provided
  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`,
    );
  }

  // Add event type filter
  if (filters.eventType && filters.eventType !== "all") {
    query = query.eq("event_type", filters.eventType);
  }

  // Add time frame filter
  if (filters.timeFrame) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (filters.timeFrame) {
      case "today":
        endDate.setHours(23, 59, 59, 999);
        break;
      case "tomorrow":
        startDate.setDate(now.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() + 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "this_week":
        endDate.setDate(now.getDate() + (7 - now.getDay()));
        endDate.setHours(23, 59, 59, 999);
        break;
      case "this_weekend":
        startDate.setDate(now.getDate() + (6 - now.getDay())); // Saturday
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() + (7 - now.getDay())); // Sunday
        endDate.setHours(23, 59, 59, 999);
        break;
      case "next_week":
        startDate.setDate(now.getDate() + (7 - now.getDay()) + 1); // Next Monday
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() + (7 - now.getDay()) + 7); // Next Sunday
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    if (filters.timeFrame !== "all") {
      query = query
        .gte("start_date", startDate.toISOString())
        .lte("start_date", endDate.toISOString());
    }
  }

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Calculate distances and filter by radius
  const eventsWithDistance = data
    ?.map((event: any) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        event.latitude,
        event.longitude,
      );
      return { ...event, distance };
    })
    .filter((event: any) => event.distance <= radiusKm)
    .sort((a: any, b: any) => a.distance - b.distance);

  return { data: eventsWithDistance, error: null };
};

// Saved locations management
export const saveUserLocation = async (
  userId: string,
  locationData: {
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    location_type?: string;
    is_default?: boolean;
  },
) => {
  // If setting as default, unset other defaults first
  if (locationData.is_default) {
    await supabase
      .from("saved_locations")
      .update({ is_default: false })
      .eq("user_id", userId);
  }

  const { data, error } = await supabase
    .from("saved_locations")
    .insert({
      user_id: userId,
      ...locationData,
    })
    .select()
    .single();

  return { data, error };
};

export const getUserSavedLocations = async (userId: string) => {
  const { data, error } = await supabase
    .from("saved_locations")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return { data, error };
};

export const deleteUserSavedLocation = async (locationId: string) => {
  const { data, error } = await supabase
    .from("saved_locations")
    .delete()
    .eq("id", locationId);

  return { data, error };
};

// Search history and analytics
export const saveLocationSearch = async (
  userId: string,
  searchData: {
    search_latitude: number;
    search_longitude: number;
    search_radius: number;
    search_query?: string;
    category?: string;
    location_name?: string;
  },
) => {
  // Check if similar search exists and update count
  const { data: existingSearch } = await supabase
    .from("location_searches")
    .select("*")
    .eq("user_id", userId)
    .eq("search_latitude", searchData.search_latitude)
    .eq("search_longitude", searchData.search_longitude)
    .eq("search_query", searchData.search_query || "")
    .single();

  if (existingSearch) {
    // Update existing search
    const { data, error } = await supabase
      .from("location_searches")
      .update({
        search_count: existingSearch.search_count + 1,
        last_searched: new Date().toISOString(),
      })
      .eq("id", existingSearch.id)
      .select()
      .single();

    return { data, error };
  } else {
    // Create new search record
    const { data, error } = await supabase
      .from("location_searches")
      .insert({
        user_id: userId,
        ...searchData,
      })
      .select()
      .single();

    return { data, error };
  }
};

export const getUserSearchHistory = async (
  userId: string,
  limit: number = 10,
) => {
  const { data, error } = await supabase
    .from("location_searches")
    .select("*")
    .eq("user_id", userId)
    .order("last_searched", { ascending: false })
    .limit(limit);

  return { data, error };
};

// Event-Product relationships
export const addProductToEvent = async (
  eventId: string,
  productId: string,
  featured: boolean = false,
) => {
  const { data, error } = await supabase
    .from("event_products")
    .insert({
      event_id: eventId,
      product_id: productId,
      featured,
    })
    .select()
    .single();

  return { data, error };
};

export const getEventProducts = async (eventId: string) => {
  const { data, error } = await supabase
    .from("event_products")
    .select(
      `
      *,
      products (*)
    `,
    )
    .eq("event_id", eventId)
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true });

  return { data, error };
};

export const removeProductFromEvent = async (
  eventId: string,
  productId: string,
) => {
  const { data, error } = await supabase
    .from("event_products")
    .delete()
    .eq("event_id", eventId)
    .eq("product_id", productId);

  return { data, error };
};

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

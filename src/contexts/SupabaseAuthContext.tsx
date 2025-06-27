import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  supabase,
  getCurrentUser,
  signIn,
  signUp,
  signInWithGoogle,
  signOut,
  getProfile,
  createProfile,
} from "@/lib/supabase";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user);

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setSupabaseUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      const { user: supabaseUser } = await getCurrentUser();
      if (supabaseUser) {
        await loadUserProfile(supabaseUser);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      setSupabaseUser(supabaseUser);

      // Try to get existing profile
      let { data: profile, error } = await getProfile(supabaseUser.id);

      // If no profile exists, create one
      if (error && error.code === "PGRST116") {
        const { data: newProfile, error: createError } =
          await createProfile(supabaseUser);
        if (createError) {
          console.error("Error creating profile:", createError);
          return;
        }
        profile = newProfile;
      } else if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (profile) {
        // Convert Supabase profile to app User type
        const appUser: User = {
          id: profile.id,
          name: profile.full_name || "User",
          email: profile.email,
          avatar: profile.avatar_url || undefined,
          phone: profile.phone || undefined,
          hasSellerAccess: profile.has_seller_access || false,
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
            language: "English",
            currency: "USD",
          },
        };

        setUser(appUser);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
    }
    return { error };
  };

  const handleSignUp = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setLoading(false);
    }
    return { error };
  };

  const handleSignInWithGoogle = async () => {
    const { error } = await signInWithGoogle();
    return { error };
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setUser(null);
    setSupabaseUser(null);
    setLoading(false);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user || !supabaseUser) {
      return { error: { message: "No user logged in" } };
    }

    try {
      setLoading(true);

      // Update profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: updates.name,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        return { error };
      }

      // Update local state
      setUser((prevUser) => ({
        ...prevUser!,
        ...updates,
      }));

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    supabaseUser,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useSupabaseAuth must be used within a SupabaseAuthProvider",
    );
  }
  return context;
}

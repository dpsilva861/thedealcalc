import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
  analyses_used: number;
  free_analyses_limit: number;
  plan_tier: string;
  selected_calculator: string | null;
}

// Available calculators - add more here as they become available
export const AVAILABLE_CALCULATORS = [
  { id: "residential", name: "Residential Underwriting", description: "Analyze single-family and small multifamily properties" },
  // Future calculators will be added here
  // { id: "commercial", name: "Commercial", description: "Analyze commercial properties" },
  // { id: "multifamily", name: "Large Multifamily", description: "Analyze 50+ unit properties" },
] as const;

export type CalculatorId = typeof AVAILABLE_CALCULATORS[number]["id"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isSubscribed: boolean;
  planTier: string;
  selectedCalculator: string | null;
  canAccessCalculator: (calculatorId: string) => boolean;
  canRunAnalysis: boolean;
  freeTrialRemaining: number;
  incrementAnalysisCount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile | null;
  };

  const ensureProfile = async (u: User): Promise<Profile | null> => {
    const existing = await fetchProfile(u.id);
    if (existing) return existing;

    // Create default profile
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: u.id,
          email: u.email ?? null,
          subscription_status: "inactive",
          analyses_used: 0,
          free_analyses_limit: 3,
          plan_tier: "free",
          selected_calculator: null,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Error creating profile:", upsertError);
      return null;
    }

    return await fetchProfile(u.id);
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await ensureProfile(user);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setLoading(true);
        setTimeout(() => {
          ensureProfile(session.user)
            .then((p) => {
              setProfile(p);
            })
            .finally(() => {
              setLoading(false);
            });
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        ensureProfile(session.user)
          .then((profileData) => {
            setProfile(profileData);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const incrementAnalysisCount = async () => {
    if (!profile) return;

    const newCount = (profile.analyses_used || 0) + 1;
    
    const { error } = await supabase
      .from("profiles")
      .update({ analyses_used: newCount })
      .eq("user_id", profile.user_id);

    if (!error) {
      setProfile({ ...profile, analyses_used: newCount });
    }
  };

  // Plan and subscription status
  const planTier = profile?.plan_tier || "free";
  const selectedCalculator = profile?.selected_calculator || null;
  const isSubscribed = profile?.subscription_status === "active" && planTier !== "free";
  
  // Admin emails get unlimited free access
  const ADMIN_EMAILS = ["dpsilva861@gmail.com"];
  const isAdminUser = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  // Check if user can access a specific calculator
  const canAccessCalculator = (calculatorId: string): boolean => {
    if (isAdminUser) return true;
    
    if (planTier === "basic" && isSubscribed) {
      // Basic plan: only selected calculator
      return calculatorId === selectedCalculator;
    }
    
    if (planTier === "pro" && isSubscribed) {
      // Pro plan: all calculators (future)
      return true;
    }
    
    // Free tier: use free trial logic
    return freeTrialRemaining > 0;
  };
  
  const freeTrialRemaining = profile 
    ? Math.max(0, (profile.free_analyses_limit || 1) - (profile.analyses_used || 0))
    : 0;
  
  // User can run analysis if:
  // - Subscribed and accessing their selected calculator
  // - Has free trial remaining
  // - Is admin
  const canRunAnalysis = isSubscribed || freeTrialRemaining > 0 || isAdminUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        isSubscribed,
        planTier,
        selectedCalculator,
        canAccessCalculator,
        canRunAnalysis,
        freeTrialRemaining,
        incrementAnalysisCount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
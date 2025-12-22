import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { canAccessCalculator as checkCanAccessCalculator, requiresBasicSelection, PlanTier } from "@/lib/entitlements";

interface Profile {
  id: string;
  user_id: string;
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isSubscribed: boolean;
  planTier: PlanTier;
  selectedCalculator: string | null;
  canAccessCalculator: (calculatorId: string) => boolean;
  requiresCalculatorSelection: boolean;
  updateSelectedCalculator: (calculatorId: string) => Promise<void>;
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

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data as Profile | null;
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      return null;
    }
  }, []);

  const ensureProfile = useCallback(
    async (u: User): Promise<Profile | null> => {
      try {
        const existing = await fetchProfile(u.id);
        if (existing) return existing;

        // Create default profile
        const { error: upsertError } = await supabase.from("profiles").upsert(
          {
            user_id: u.id,
            subscription_status: "inactive",
            analyses_used: 0,
            free_analyses_limit: 3,
            plan_tier: "free",
            selected_calculator: null,
          },
          { onConflict: "user_id" },
        );

        if (upsertError) {
          console.error("Error creating profile:", upsertError);
          return null;
        }

        return await fetchProfile(u.id);
      } catch (error) {
        console.error("Unexpected error ensuring profile:", error);
        return null;
      }
    },
    [fetchProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      console.warn("Cannot refresh profile: no user logged in");
      return;
    }

    try {
      const profileData = await ensureProfile(user);
      setProfile(profileData);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  }, [user, ensureProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profileData = await ensureProfile(currentSession.user);
          if (mounted) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log("Auth state changed:", event);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setLoading(true);
        try {
          const profileData = await ensureProfile(newSession.user);
          if (mounted) {
            setProfile(profileData);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      return { error };
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
      return {
        error:
          error instanceof Error
            ? (error as AuthError)
            : (new Error("An unexpected error occurred during sign up") as AuthError),
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return {
        error:
          error instanceof Error
            ? (error as AuthError)
            : (new Error("An unexpected error occurred during sign in") as AuthError),
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      // Still clear local state even if API call fails
      setProfile(null);
      setUser(null);
      setSession(null);
    }
  };

  const incrementAnalysisCount = useCallback(async () => {
    if (!profile) {
      console.warn("Cannot increment analysis count: no profile loaded");
      return;
    }

    const newCount = (profile.analyses_used || 0) + 1;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ analyses_used: newCount })
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("Error incrementing analysis count:", error);
        throw error;
      }

      // Optimistically update local state
      setProfile({ ...profile, analyses_used: newCount });
    } catch (error) {
      console.error("Failed to increment analysis count:", error);
      throw error;
    }
  }, [profile]);

  const updateSelectedCalculator = useCallback(
    async (calculatorId: string) => {
      if (!profile) {
        throw new Error("Cannot update calculator selection: no profile loaded");
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ selected_calculator: calculatorId })
          .eq("user_id", profile.user_id);

        if (error) {
          console.error("Error updating selected calculator:", error);
          throw error;
        }

        // Optimistically update local state
        setProfile({ ...profile, selected_calculator: calculatorId });

        // Persist to localStorage as fallback
        try {
          localStorage.setItem(`selected_calculator_${profile.user_id}`, calculatorId);
        } catch (storageError) {
          console.warn("Failed to save calculator selection to localStorage:", storageError);
        }
      } catch (error) {
        console.error("Failed to update selected calculator:", error);
        throw error;
      }
    },
    [profile],
  );

  // Memoized computed values
  const planTier = (profile?.plan_tier || "free") as PlanTier;
  const selectedCalculator = profile?.selected_calculator || null;
  const isSubscribed = profile?.subscription_status === "active" && planTier !== "free";

  const freeTrialRemaining = profile
    ? Math.max(0, (profile.free_analyses_limit || 1) - (profile.analyses_used || 0))
    : 0;

  const requiresCalculatorSelection = requiresBasicSelection(planTier, selectedCalculator, isSubscribed);

  const canAccessCalculator = useCallback(
    (calculatorId: string): boolean => {
      return checkCanAccessCalculator(planTier, calculatorId, selectedCalculator, isSubscribed);
    },
    [planTier, selectedCalculator, isSubscribed],
  );

  const canRunAnalysis = isSubscribed || freeTrialRemaining > 0;

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
        requiresCalculatorSelection,
        updateSelectedCalculator,
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

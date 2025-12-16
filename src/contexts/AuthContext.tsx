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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isSubscribed: boolean;
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

    // Create default profile so new users always receive 3 free analyses.
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: u.id,
          email: u.email ?? null,
          subscription_status: "inactive",
          analyses_used: 0,
          free_analyses_limit: 3,
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
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Keep the app in a loading state until we've ensured the user has a profile
        // so we don't flash the paywall for brand-new users.
        setLoading(true);

        // Defer profile calls to avoid auth deadlocks
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

    // THEN check for existing session
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

  const isSubscribed = profile?.subscription_status === "active";
  
  // Admin emails get unlimited free access
  const ADMIN_EMAILS = ["dpsilva861@gmail.com"];
  const isAdminUser = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  // User can run analysis if subscribed OR has free trial remaining OR is admin
  const freeTrialRemaining = profile 
    ? Math.max(0, (profile.free_analyses_limit || 1) - (profile.analyses_used || 0))
    : 0;
  
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

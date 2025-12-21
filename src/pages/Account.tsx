import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth, AVAILABLE_CALCULATORS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Calculator
} from "lucide-react";

export default function Account() {
  const { user, profile, loading, isSubscribed, planTier, selectedCalculator, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Handle successful checkout redirect - verify server-side
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId && user && !verifying) {
      setVerifying(true);
      
      const verifyCheckout = async () => {
        try {
          const response = await supabase.functions.invoke("verify-checkout", {
            body: { session_id: sessionId },
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          if (response.data?.error) {
            throw new Error(response.data.error);
          }

          toast.success("Subscription activated! Welcome to Basic.");
          await refreshProfile();
        } catch (error: any) {
          console.error("Verification error:", error);
          toast.error(error?.message || "Failed to verify subscription. Please try syncing.");
        } finally {
          setVerifying(false);
          // Clean up URL
          setSearchParams({}, { replace: true });
        }
      };

      verifyCheckout();
    }
  }, [searchParams, user, refreshProfile, setSearchParams, verifying]);

  if (loading || verifying) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {verifying ? "Verifying your subscription..." : "Loading..."}
          </p>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await supabase.functions.invoke("customer-portal", {
        body: { origin: window.location.origin },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSubscribe = async () => {
    navigate("/pricing");
  };

  const handleSyncSubscription = async () => {
    setSyncLoading(true);
    try {
      const response = await supabase.functions.invoke("sync-subscription");

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      await refreshProfile();
      toast.success(`Subscription synced: ${response.data?.status || 'unknown'}`);
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync subscription status");
    } finally {
      setSyncLoading(false);
    }
  };

  const selectedCalcInfo = AVAILABLE_CALCULATORS.find(c => c.id === selectedCalculator);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-foreground mb-8">
            Account Settings
          </h1>

          {/* Profile Section */}
          <section className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Your account information
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Member since</label>
                <p className="font-medium text-foreground">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Subscription</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your plan and billing
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSubscribed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {isSubscribed ? "Basic Plan" : "No Active Subscription"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed 
                        ? "$3/month • Unlimited analyses"
                        : "Subscribe to unlock unlimited access"
                      }
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isSubscribed 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {planTier.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Selected Calculator - only show for subscribed users */}
            {isSubscribed && selectedCalcInfo && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Your calculator:</p>
                    <p className="font-medium text-foreground">{selectedCalcInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCalcInfo.description}</p>
                  </div>
                </div>
              </div>
            )}

            {isSubscribed ? (
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Opening...
                  </>
                ) : (
                  <>
                    Manage Subscription
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubscribe}>
                Subscribe Now — $3/month
              </Button>
            )}
          </section>

          {/* Actions */}
          <section className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSyncSubscription}
              disabled={syncLoading}
            >
              {syncLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Status
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
            >
              Sign Out
            </Button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
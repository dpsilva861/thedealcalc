import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink 
} from "lucide-react";

export default function Account() {
  const { user, profile, loading, isSubscribed, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleManageSubscription = () => {
    // Will be implemented with Stripe Customer Portal
    navigate("/pricing");
  };

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
                <p className="font-medium text-foreground">{profile.email || user.email}</p>
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
                      {isSubscribed ? "Pro Plan" : "No Active Subscription"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed 
                        ? "$5/month • Unlimited analyses"
                        : "Subscribe to access the underwriting tool"
                      }
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isSubscribed 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {profile.subscription_status.toUpperCase()}
                </span>
              </div>
            </div>

            {isSubscribed ? (
              <Button variant="outline" onClick={handleManageSubscription}>
                Manage Subscription
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button variant="hero" onClick={() => navigate("/pricing")}>
                Subscribe Now — $5/month
              </Button>
            )}
          </section>

          {/* Actions */}
          <section className="flex justify-end">
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

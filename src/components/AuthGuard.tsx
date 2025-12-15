import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Paywall } from "./Paywall";
import { RefreshCw } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export function AuthGuard({ children, requireSubscription = false }: AuthGuardProps) {
  const { user, loading, isSubscribed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - will redirect
  if (!user) {
    return null;
  }

  // Logged in but subscription required and not subscribed
  if (requireSubscription && !isSubscribed) {
    return (
      <Paywall 
        title="Upgrade to Pro"
        description="Subscribe to access the underwriting tool and run unlimited deal analyses."
      />
    );
  }

  // All checks passed
  return <>{children}</>;
}

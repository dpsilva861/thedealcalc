import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { validatePassword, parsePasswordError } from "@/lib/password-validation";
import { PasswordRequirements } from "@/components/PasswordRequirements";

// Zod schema that mirrors backend requirements
const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};'\\:"|<>?,./`~]/, "Password must contain a symbol"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Real-time password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password === confirmPassword || confirmPassword === "";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/underwrite");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs with Zod
    const result = signupSchema.safeParse({ email, password, confirmPassword });
    
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: "Validation error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    // Additional client-side validation for password requirements
    if (!passwordValidation.isValid) {
      toast({
        title: "Password requirements not met",
        description: passwordValidation.errorMessage || "Please meet all password requirements.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(email.trim(), password);
    
    if (error) {
      // Parse and display user-friendly error message
      const userMessage = parsePasswordError(error);
      
      toast({
        title: "Sign up failed",
        description: userMessage,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Account created!",
      description: "Welcome to DealCalc. You have 3 free analyses to try it out.",
    });
    
    navigate("/underwrite");
  };

  const benefits = [
    "3 free deal analyses",
    "Professional PDF reports",
    "Complete data privacy",
    "No credit card required",
  ];

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-semibold text-foreground">
                DealCalc
              </span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Create Your Account
            </h1>
            <p className="text-muted-foreground">
              Start with a free analysis—no credit card required
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            {/* Free Trial Badge */}
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-sage-light rounded-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">3 Free Analyses Included</span>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-muted/50 rounded-xl">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowRequirements(true)}
                  required
                  autoComplete="new-password"
                  aria-describedby="password-requirements"
                />
                
                {/* Password requirements - shown when focused or has content */}
                {(showRequirements || password.length > 0) && (
                  <div id="password-requirements" className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <PasswordRequirements
                      requirements={passwordValidation.requirements}
                      password={password}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={
                    confirmPassword && !passwordsMatch
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full" 
                size="lg"
                disabled={loading || !passwordValidation.isValid || !passwordsMatch}
              >
                {loading ? "Creating account..." : "Create Free Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

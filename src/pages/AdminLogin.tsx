import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { parsePasswordError, validatePassword } from '@/lib/password-validation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const emailSchema = z.string().email('Enter a valid email address');

type Mode = 'signin' | 'signup' | 'forgot';

export default function AdminLogin() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedEmail = emailSchema.safeParse(email.trim());
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]?.message ?? 'Enter a valid email');
      return;
    }

    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    if (mode === 'signup' && !passwordValidation.isValid) {
      toast.error(passwordValidation.errorMessage ?? 'Please choose a stronger password');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(parsedEmail.data, password);
        if (error) {
          toast.error(parsePasswordError(error));
          return;
        }
        navigate('/admin/blog');
        return;
      }

      const { data, error } = await signUp(parsedEmail.data, password);
      if (error) {
        toast.error(parsePasswordError(error));
        return;
      }

      // If auto-confirm is enabled, session may exist immediately.
      if (data?.session) {
        toast.success('Account created. Welcome!');
        navigate('/admin/blog');
      } else {
        toast.success('Account created. Check your email to confirm, then sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
    // On success, browser redirects to Google.
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedEmail = emailSchema.safeParse(email.trim());
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]?.message ?? 'Enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Check your email for the password reset link');
      setMode('signin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | TheDealCalc</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Blog Admin</CardTitle>
            <CardDescription>Sign in (or create an admin account) to manage posts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleEmailPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-primary mt-2 text-center"
                  onClick={() => setMode('forgot')}
                >
                  Forgot password?
                </button>

                <Separator className="my-4" />

                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                  Continue with Google
                </Button>
              </TabsContent>

              <TabsContent value="forgot" className="mt-4">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="email-forgot">Email</Label>
                    <Input
                      id="email-forgot"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-primary mt-4 text-center"
                  onClick={() => setMode('signin')}
                >
                  Back to sign in
                </button>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleEmailPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="password-signup">Password</Label>
                      <Input
                        id="password-signup"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>

                    <PasswordRequirements requirements={passwordValidation.requirements} password={password} />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Account
                  </Button>
                </form>

                <Separator className="my-4" />

                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                  Continue with Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

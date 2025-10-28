'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Grid, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get('token');

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
      setValidToken(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setValidToken(true);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Invalid or expired reset token');
          setValidToken(false);
        }
      } catch (err) {
        setError('Failed to verify reset token');
        setValidToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      setSuccess(true);
      toast({
        title: 'Password reset successful!',
        description: 'Your password has been updated. You can now sign in with your new password.',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b shrink-0 bg-card/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center size-7 md:size-8 bg-primary/10 rounded-lg shadow-inner">
              <Grid className="size-3 md:size-4 text-primary" />
            </div>
            <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
              GridMapper
            </h1>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b shrink-0 bg-card/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center size-7 md:size-8 bg-primary/10 rounded-lg shadow-inner">
              <Grid className="size-3 md:size-4 text-primary" />
            </div>
            <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
              GridMapper
            </h1>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold text-destructive">Invalid Reset Link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Link href="/login" className="w-full">
                  <Button className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b shrink-0 bg-card/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-7 md:size-8 bg-primary/10 rounded-lg shadow-inner">
            <Grid className="size-3 md:size-4 text-primary" />
          </div>
          <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
            GridMapper
          </h1>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center size-12 bg-primary/10 rounded-xl shadow-inner">
                <Lock className="size-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Reset Password</h1>
            <p className="text-muted-foreground text-sm">Enter your new password below</p>
          </div>

          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-semibold">Set New Password</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Choose a strong password for your account
              </CardDescription>
            </CardHeader>

            {success ? (
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Password Reset Successful!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your password has been updated successfully.
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to sign in page...
                </p>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="border-destructive/20">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors pr-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent touch-manipulation"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors pr-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent touch-manipulation"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-10 touch-manipulation font-medium" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm">
                    <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
                      Back to Sign In
                    </Link>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>

          <div className="text-center mt-4">
            <Link 
              href="/" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              ← Back to GridMapper
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b shrink-0 bg-card/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center size-7 md:size-8 bg-primary/10 rounded-lg shadow-inner">
              <Grid className="size-3 md:size-4 text-primary" />
            </div>
            <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
              GridMapper
            </h1>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

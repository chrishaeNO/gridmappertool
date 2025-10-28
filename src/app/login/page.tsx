'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Grid, LogIn, Eye, EyeOff, ArrowLeft, Mail, Lock, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'sms'>('sms');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [smsResetEmail, setSmsResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { user, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
      
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');

    if (!resetEmail) {
      setError('Email is required');
      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      setResetSuccess(true);
      setCanResend(false);
      setCountdown(60); // 60 seconds countdown
      toast({
        title: 'Reset email sent!',
        description: 'Check your email for password reset instructions. If you don\'t receive it, you can request a new one in 60 seconds.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSMSReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');

    if (!smsResetEmail || !resetPhone) {
      setError('Email and phone number are required');
      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: smsResetEmail, phone: resetPhone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send SMS code');
      }

      setShowCodeInput(true);
      setCanResend(false);
      setCountdown(60);
      toast({
        title: 'SMS code sent!',
        description: 'Check your phone for a 6-digit reset code.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSMSPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');

    if (!smsCode || !newPassword || !confirmNewPassword) {
      setError('All fields are required');
      setResetLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: smsResetEmail, 
          code: smsCode, 
          password: newPassword 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      toast({
        title: 'Password reset successful!',
        description: 'You can now sign in with your new password.',
      });

      // Reset form and go back to login
      setShowForgotPassword(false);
      setShowCodeInput(false);
      setResetPhone('');
      setSmsResetEmail('');
      setSmsCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendSMS = async () => {
    if (!canResend || resetLoading) return;
    
    setResetLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/forgot-password-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: smsResetEmail, phone: resetPhone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send SMS code');
      }

      setCanResend(false);
      setCountdown(60);
      toast({
        title: 'SMS code sent again!',
        description: 'Check your phone for a new 6-digit code.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!canResend || resetLoading) return;
    
    setResetLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      setCanResend(false);
      setCountdown(60);
      toast({
        title: 'Reset email sent again!',
        description: 'Check your email for password reset instructions.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Header Navigation */}
      <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b shrink-0 bg-card/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-7 md:size-8 bg-primary/10 rounded-lg shadow-inner">
            <Grid className="size-3 md:size-4 text-primary" />
          </div>
          <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
            GridMapper
          </h1>
        </Link>
        <Link href="/register">
          <Button variant="outline" className="h-8 px-3 text-sm touch-manipulation">
            Create Account
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Welcome Section - Compact */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center size-12 bg-primary/10 rounded-xl shadow-inner">
                <Grid className="size-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your GridMapper account</p>
          </div>

          {/* Login/Reset Form */}
          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-semibold">
                {showForgotPassword 
                  ? (showCodeInput ? 'Enter Reset Code' : 'Reset Password')
                  : 'Sign In'
                }
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                {showForgotPassword 
                  ? (showCodeInput 
                      ? 'Enter the 6-digit code sent to your phone'
                      : (resetMethod === 'sms' 
                          ? 'Enter your email and phone number to receive a reset code'
                          : 'Enter your email to receive reset instructions'
                        )
                    )
                  : 'Enter your credentials to access your account'
                }
              </CardDescription>
            </CardHeader>
            <form onSubmit={
              showForgotPassword 
                ? (showCodeInput 
                    ? handleSMSPasswordReset 
                    : (resetMethod === 'sms' ? handleSMSReset : handleForgotPassword)
                  )
                : handleSubmit
            }>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-destructive/20">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {resetSuccess && resetMethod === 'email' && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>Password reset email sent! Check your inbox and follow the instructions.</p>
                        {countdown > 0 ? (
                          <p className="text-xs text-green-600">
                            Didn't receive the email? You can request a new one in {countdown} seconds.
                          </p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-green-600">Didn't receive the email?</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleResendEmail}
                              disabled={resetLoading || !canResend}
                              className="h-6 px-2 text-xs bg-green-50 border-green-300 hover:bg-green-100"
                            >
                              {resetLoading ? 'Sending...' : 'Send Again'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {showCodeInput && resetMethod === 'sms' && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>SMS code sent to your phone! Enter the 6-digit code below.</p>
                        {countdown > 0 ? (
                          <p className="text-xs text-green-600">
                            Didn't receive the code? You can request a new one in {countdown} seconds.
                          </p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-green-600">Didn't receive the code?</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleResendSMS}
                              disabled={resetLoading || !canResend}
                              className="h-6 px-2 text-xs bg-green-50 border-green-300 hover:bg-green-100"
                            >
                              {resetLoading ? 'Sending...' : 'Send Again'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Method selection for password reset */}
                {showForgotPassword && !showCodeInput && (
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <button
                      type="button"
                      onClick={() => setResetMethod('sms')}
                      className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                        resetMethod === 'sms' 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toast({
                          title: 'Coming Soon',
                          description: 'Email reset functionality is being implemented.',
                        });
                      }}
                      className="flex-1 px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-muted-foreground cursor-not-allowed relative"
                      disabled
                    >
                      <Mail className="w-4 h-4" />
                      Email
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                        Soon
                      </span>
                    </button>
                  </div>
                )}

                {/* Regular login fields */}
                {!showForgotPassword && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors"
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          required
                          className="h-10 text-sm border-border/50 focus:border-primary transition-colors pr-10"
                          autoComplete="current-password"
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
                  </>
                )}

                {/* Email reset field */}
                {showForgotPassword && !showCodeInput && resetMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={resetLoading}
                      required
                      className="h-10 text-sm border-border/50 focus:border-primary transition-colors"
                      autoComplete="email"
                    />
                  </div>
                )}

                {/* SMS reset fields */}
                {showForgotPassword && !showCodeInput && resetMethod === 'sms' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="smsResetEmail" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="smsResetEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={smsResetEmail}
                        onChange={(e) => setSmsResetEmail(e.target.value)}
                        disabled={resetLoading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors"
                        autoComplete="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="resetPhone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="resetPhone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)}
                        disabled={resetLoading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors"
                        autoComplete="tel"
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll send a 6-digit code to this number (e.g., +47 12345678 or 12345678)
                      </p>
                    </div>
                  </>
                )}

                {/* SMS code and new password fields */}
                {showCodeInput && resetMethod === 'sms' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="smsCode" className="text-sm font-medium">6-Digit Code</Label>
                      <Input
                        id="smsCode"
                        type="text"
                        placeholder="123456"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={resetLoading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors text-center text-lg tracking-widest"
                        maxLength={6}
                        autoComplete="one-time-code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={resetLoading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword" className="text-sm font-medium">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        disabled={resetLoading}
                        required
                        className="h-10 text-sm border-border/50 focus:border-primary transition-colors"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-10 touch-manipulation font-medium" 
                  disabled={loading || resetLoading}
                >
                  {(loading || resetLoading) ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                      {showForgotPassword 
                        ? (showCodeInput ? 'Resetting Password...' : 'Sending...')
                        : 'Signing In...'
                      }
                    </>
                  ) : (
                    <>
                      {showForgotPassword ? (
                        showCodeInput ? (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Reset Password
                          </>
                        ) : (
                          resetMethod === 'sms' ? (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Send SMS Code
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reset Email
                            </>
                          )
                        )
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </>
                  )}
                </Button>

                {showForgotPassword ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (showCodeInput) {
                        setShowCodeInput(false);
                        setSmsCode('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                      } else {
                        setShowForgotPassword(false);
                        setResetSuccess(false);
                        setSmsResetEmail('');
                        setResetPhone('');
                      }
                      setError('');
                    }}
                    className="w-full h-8 text-sm"
                  >
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    {showCodeInput ? 'Back to Phone Number' : 'Back to Sign In'}
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-2 text-center text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError('');
                      }}
                      className="text-primary hover:underline font-medium transition-colors"
                    >
                      Forgot your password?
                    </button>
                    <div>
                      <span className="text-muted-foreground">Don't have an account? </span>
                      <Link href="/register" className="text-primary hover:underline font-medium transition-colors">
                        Create one here
                      </Link>
                    </div>
                  </div>
                )}
              </CardFooter>
            </form>
          </Card>

          {/* Back Link */}
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

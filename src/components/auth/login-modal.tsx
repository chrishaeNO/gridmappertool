'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export default function LoginModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  title = "Sign In Required",
  description = "Please sign in to save and share your maps."
}: LoginModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleAuthError = (error: Error) => {
    setIsLoading(false);
    toast({
      variant: 'destructive',
      title: 'Authentication Failed',
      description: error.message,
    });
  };

  const handleSignIn = async (data: FormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      handleAuthError(error as Error);
    }
  };

  const handleSignUp = async (data: FormData) => {
    setIsLoading(true);
    try {
      await register(data.email, data.password);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      handleAuthError(error as Error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Form {...form}>
            <form className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <div className="flex gap-2">
            <Button 
              onClick={form.handleSubmit(handleSignIn)} 
              disabled={isLoading} 
              className="flex-1"
            >
              Sign In
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSignUp)} 
              disabled={isLoading} 
              className="flex-1" 
              variant="secondary"
            >
              Sign Up
            </Button>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

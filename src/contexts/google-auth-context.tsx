'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleDriveService } from '@/lib/google-drive';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface GoogleAuthContextType {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  accessToken: string | null;
  driveService: GoogleDriveService | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveService, setDriveService] = useState<GoogleDriveService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeGoogleAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const initializeGoogleAuth = async () => {
    try {
      // Load Google Identity Services
      if (!window.google) {
        await loadGoogleScript();
      }

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: handleCredentialResponse,
      });

      // Check if user is already signed in
      const savedToken = localStorage.getItem('google_access_token');
      const savedUser = localStorage.getItem('google_user');
      
      if (savedToken && savedUser) {
        try {
          setAccessToken(savedToken);
          setUser(JSON.parse(savedUser));
          setDriveService(new GoogleDriveService(savedToken));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error restoring Google session:', error);
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_user');
        }
      }
    } catch (error) {
      console.error('Google Auth initialization error:', error);
      setError('Failed to initialize Google authentication');
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-identity-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const googleUser: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      // For Drive access, we need to use OAuth2 flow
      // This is a simplified version - in production you'd want proper OAuth2
      setUser(googleUser);
      localStorage.setItem('google_user', JSON.stringify(googleUser));
      
      // Note: For actual Drive access, you need to implement OAuth2 flow
      // This is just for authentication
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Error handling credential response:', error);
      setError('Failed to process Google sign-in');
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.google) {
        throw new Error('Google Identity Services not loaded');
      }

      // For Drive access, we need OAuth2 flow
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setDriveService(new GoogleDriveService(response.access_token));
            localStorage.setItem('google_access_token', response.access_token);
            
            // Get user info
            getUserInfo(response.access_token);
          }
        },
      });

      client.requestAccessToken();
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        const googleUser: GoogleUser = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        };

        setUser(googleUser);
        setIsAuthenticated(true);
        localStorage.setItem('google_user', JSON.stringify(googleUser));
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      if (accessToken && window.google) {
        window.google.accounts.oauth2.revoke(accessToken);
      }
      
      setUser(null);
      setAccessToken(null);
      setDriveService(null);
      setIsAuthenticated(false);
      setError(null);
      
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_user');
    } catch (error: any) {
      console.error('Google logout error:', error);
      setError(error.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const value: GoogleAuthContextType = {
    isAuthenticated,
    user,
    accessToken,
    driveService,
    login,
    logout,
    loading,
    error,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth(): GoogleAuthContextType {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}

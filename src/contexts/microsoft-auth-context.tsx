'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicClientApplication, AccountInfo, SilentRequest } from '@azure/msal-browser';
import { MicrosoftGraphService } from '@/lib/microsoft-graph';

const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || 'demo-client-id',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: typeof window !== 'undefined' ? 'localStorage' : 'memory',
    storeAuthStateInCookie: false,
  },
};

const loginRequest = {
  scopes: [
    'User.Read',
    'Files.ReadWrite',
    'Sites.ReadWrite.All',
    'Team.ReadBasic.All',
    'Channel.ReadBasic.All',
    'ChatMessage.Send'
  ],
};

interface MicrosoftAuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  accessToken: string | null;
  graphService: MicrosoftGraphService | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const MicrosoftAuthContext = createContext<MicrosoftAuthContextType | undefined>(undefined);

export function MicrosoftAuthProvider({ children }: { children: React.ReactNode }) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [graphService, setGraphService] = useState<MicrosoftGraphService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const instance = new PublicClientApplication(msalConfig);
      setMsalInstance(instance);
      initializeMsal(instance);
    } else {
      setLoading(false);
    }
  }, []);

  const initializeMsal = async (instance: PublicClientApplication) => {
    try {
      await instance.initialize();
      
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        setUser(accounts[0]);
        await acquireTokenSilent(accounts[0], instance);
      }
    } catch (error) {
      console.error('MSAL initialization error:', error);
      setError('Failed to initialize Microsoft authentication');
    } finally {
      setLoading(false);
    }
  };

  const acquireTokenSilent = async (account: AccountInfo, instance?: PublicClientApplication) => {
    const msalToUse = instance || msalInstance;
    if (!msalToUse) return;
    
    try {
      const silentRequest: SilentRequest = {
        ...loginRequest,
        account,
      };

      const response = await msalToUse.acquireTokenSilent(silentRequest);
      setAccessToken(response.accessToken);
      setGraphService(new MicrosoftGraphService(response.accessToken));
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      // Token might be expired, user needs to login again
      setIsAuthenticated(false);
      setAccessToken(null);
      setGraphService(null);
    }
  };

  const login = async () => {
    if (!msalInstance) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await msalInstance.loginPopup(loginRequest);
      
      if (response.account) {
        setUser(response.account);
        setAccessToken(response.accessToken);
        setGraphService(new MicrosoftGraphService(response.accessToken));
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!msalInstance) return;
    
    try {
      setLoading(true);
      
      const logoutRequest = {
        account: user,
      };

      await msalInstance.logoutPopup(logoutRequest);
      
      setUser(null);
      setAccessToken(null);
      setGraphService(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const value: MicrosoftAuthContextType = {
    isAuthenticated,
    user,
    accessToken,
    graphService,
    login,
    logout,
    loading,
    error,
  };

  return (
    <MicrosoftAuthContext.Provider value={value}>
      {children}
    </MicrosoftAuthContext.Provider>
  );
}

export function useMicrosoftAuth() {
  const context = useContext(MicrosoftAuthContext);
  if (context === undefined) {
    throw new Error('useMicrosoftAuth must be used within a MicrosoftAuthProvider');
  }
  return context;
}

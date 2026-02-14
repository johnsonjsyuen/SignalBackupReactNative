import React, { createContext, useCallback, useEffect, useState, type PropsWithChildren } from 'react';

import { getSettings, setSetting } from '@/lib/storage';
import { StorageKeys } from '@/constants/storage-keys';

interface AuthContextValue {
  isSignedIn: boolean;
  email: string | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextValue>({
  isSignedIn: false,
  email: null,
  isLoading: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  getAccessToken: async () => '',
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.googleAccountEmail) {
        setEmail(settings.googleAccountEmail);
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { signInWithGoogle } = await import('@/lib/google-auth');
      const result = await signInWithGoogle();
      setEmail(result.email);
      await setSetting(StorageKeys.GOOGLE_ACCOUNT_EMAIL, result.email);
    } catch (e: any) {
      setError(e.message || 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { signOutFromGoogle } = await import('@/lib/google-auth');
      await signOutFromGoogle();
      setEmail(null);
      await setSetting(StorageKeys.GOOGLE_ACCOUNT_EMAIL, null);
      await setSetting(StorageKeys.DRIVE_FOLDER_ID, null);
      await setSetting(StorageKeys.DRIVE_FOLDER_NAME, null);
    } catch (e: any) {
      setError(e.message || 'Sign-out failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccessToken = useCallback(async (): Promise<string> => {
    const { getGoogleAccessToken } = await import('@/lib/google-auth');
    return getGoogleAccessToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: email !== null,
        email,
        isLoading,
        error,
        signIn,
        signOut,
        getAccessToken,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

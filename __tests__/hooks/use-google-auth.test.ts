import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { AuthContext } from '@/providers/auth-context';

// ---------------------------------------------------------------------------
// Helper: render the hook inside an AuthContext provider with given values.
// ---------------------------------------------------------------------------

function renderWithAuthContext(overrides: {
  isSignedIn?: boolean;
  email?: string | null;
  isLoading?: boolean;
  error?: string | null;
  signIn?: () => Promise<void>;
  signOut?: () => Promise<void>;
  getAccessToken?: () => Promise<string>;
} = {}) {
  const value = {
    isSignedIn: overrides.isSignedIn ?? false,
    email: overrides.email ?? null,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    signIn: overrides.signIn ?? jest.fn(),
    signOut: overrides.signOut ?? jest.fn(),
    getAccessToken: overrides.getAccessToken ?? jest.fn(async () => ''),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthContext.Provider, { value }, children);

  return { ...renderHook(() => useGoogleAuth(), { wrapper }), contextValue: value };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGoogleAuth', () => {
  it('returns isSignedIn and email from context', () => {
    const { result } = renderWithAuthContext({
      isSignedIn: true,
      email: 'user@example.com',
    });

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.email).toBe('user@example.com');
  });

  it('returns isLoading and error from context', () => {
    const { result } = renderWithAuthContext({
      isLoading: true,
      error: 'Something went wrong',
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Something went wrong');
  });

  it('returns signIn, signOut, and getAccessToken functions', () => {
    const signIn = jest.fn();
    const signOut = jest.fn();
    const getAccessToken = jest.fn(async () => 'token');
    const { result } = renderWithAuthContext({ signIn, signOut, getAccessToken });

    expect(result.current.signIn).toBe(signIn);
    expect(result.current.signOut).toBe(signOut);
    expect(result.current.getAccessToken).toBe(getAccessToken);
  });

  it('returns defaults when no provider is present', () => {
    const { result } = renderHook(() => useGoogleAuth());

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.email).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { AuthProvider, AuthContext } from '@/providers/auth-context';
import { DEFAULT_SETTINGS } from '@/types/settings';

// ---------------------------------------------------------------------------
// Mock storage and google-auth modules.
// The provider uses dynamic imports for google-auth, but jest.mock at the
// top level handles them correctly.
// ---------------------------------------------------------------------------

jest.mock('@/lib/storage', () => ({
  getSettings: jest.fn(async () => ({ ...require('@/types/settings').DEFAULT_SETTINGS })),
  setSetting: jest.fn(async () => {}),
}));

jest.mock('@/lib/google-auth', () => ({
  signInWithGoogle: jest.fn(async () => ({ email: 'test@example.com' })),
  signOutFromGoogle: jest.fn(async () => {}),
  getGoogleAccessToken: jest.fn(async () => 'mock-access-token'),
}));

import { getSettings, setSetting } from '@/lib/storage';
import {
  signInWithGoogle,
  signOutFromGoogle,
  getGoogleAccessToken,
} from '@/lib/google-auth';

const mockedGetSettings = getSettings as jest.Mock;
const mockedSetSetting = setSetting as jest.Mock;
const mockedSignIn = signInWithGoogle as jest.Mock;
const mockedSignOut = signOutFromGoogle as jest.Mock;
const mockedGetToken = getGoogleAccessToken as jest.Mock;

// ---------------------------------------------------------------------------
// Test consumer component.
// ---------------------------------------------------------------------------

function TestConsumer() {
  const ctx = React.useContext(AuthContext);

  return (
    <>
      <Text testID="isSignedIn">{String(ctx.isSignedIn)}</Text>
      <Text testID="email">{ctx.email ?? 'null'}</Text>
      <Text testID="isLoading">{String(ctx.isLoading)}</Text>
      <Text testID="error">{ctx.error ?? 'null'}</Text>
      <Pressable testID="signInBtn" onPress={ctx.signIn} />
      <Pressable testID="signOutBtn" onPress={ctx.signOut} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthProvider', () => {
  beforeEach(() => {
    mockedGetSettings.mockReset();
    mockedGetSettings.mockResolvedValue({ ...DEFAULT_SETTINGS });
    mockedSetSetting.mockReset();
    mockedSetSetting.mockResolvedValue(undefined);
    mockedSignIn.mockReset();
    mockedSignIn.mockResolvedValue({ email: 'test@example.com' });
    mockedSignOut.mockReset();
    mockedSignOut.mockResolvedValue(undefined);
    mockedGetToken.mockReset();
    mockedGetToken.mockResolvedValue('mock-access-token');
  });

  it('provides default values (not signed in) initially', async () => {
    // Keep getSettings pending so the load effect has not completed.
    mockedGetSettings.mockReturnValue(new Promise(() => {}));

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(getByTestId('isSignedIn').props.children).toBe('false');
    expect(getByTestId('email').props.children).toBe('null');
    expect(getByTestId('isLoading').props.children).toBe('false');
    expect(getByTestId('error').props.children).toBe('null');
  });

  it('loads email from settings on mount and sets isSignedIn to true', async () => {
    mockedGetSettings.mockResolvedValue({
      ...DEFAULT_SETTINGS,
      googleAccountEmail: 'saved@example.com',
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('isSignedIn').props.children).toBe('true');
    });

    expect(getByTestId('email').props.children).toBe('saved@example.com');
  });

  it('signIn calls signInWithGoogle and updates email', async () => {
    mockedSignIn.mockResolvedValue({ email: 'newuser@example.com' });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Wait for initial load to finish.
    await waitFor(() => {
      expect(mockedGetSettings).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByTestId('signInBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('isSignedIn').props.children).toBe('true');
    });

    expect(getByTestId('email').props.children).toBe('newuser@example.com');
    expect(mockedSetSetting).toHaveBeenCalledWith(
      'google_account_email',
      'newuser@example.com',
    );
  });

  it('signIn handles error and sets error state', async () => {
    mockedSignIn.mockRejectedValue(new Error('Play Services not available'));

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockedGetSettings).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.press(getByTestId('signInBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('error').props.children).toBe('Play Services not available');
    });

    expect(getByTestId('isSignedIn').props.children).toBe('false');
    expect(getByTestId('isLoading').props.children).toBe('false');
  });

  it('signOut calls signOutFromGoogle and clears email and drive folder', async () => {
    // Start signed in.
    mockedGetSettings.mockResolvedValue({
      ...DEFAULT_SETTINGS,
      googleAccountEmail: 'user@example.com',
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('isSignedIn').props.children).toBe('true');
    });

    await act(async () => {
      fireEvent.press(getByTestId('signOutBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('isSignedIn').props.children).toBe('false');
    });

    expect(getByTestId('email').props.children).toBe('null');
    expect(mockedSignOut).toHaveBeenCalled();

    // Should clear google_account_email, drive_folder_id, and drive_folder_name.
    expect(mockedSetSetting).toHaveBeenCalledWith('google_account_email', null);
    expect(mockedSetSetting).toHaveBeenCalledWith('drive_folder_id', null);
    expect(mockedSetSetting).toHaveBeenCalledWith('drive_folder_name', null);
  });

  it('getAccessToken returns token from google-auth', async () => {
    mockedGetToken.mockResolvedValue('fresh-token-123');

    let getTokenFn: (() => Promise<string>) | undefined;

    function TokenCapture() {
      const authCtx = React.useContext(AuthContext);
      getTokenFn = authCtx.getAccessToken;
      return null;
    }

    render(
      <AuthProvider>
        <TokenCapture />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getTokenFn).toBeDefined();
    });

    let tokenResult: string | undefined;
    await act(async () => {
      tokenResult = await getTokenFn!();
    });

    expect(tokenResult).toBe('fresh-token-123');
    expect(mockedGetToken).toHaveBeenCalled();
  });
});

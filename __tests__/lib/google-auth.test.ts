// The google-auth module caches `isConfigured` in a module-level closure.
// To test that the closure resets properly, we use jest.resetModules() before
// each test to get a fresh copy of the module and its dependencies.

type GoogleAuthModule = typeof import('@/lib/google-auth');

interface GoogleSigninMock {
  configure: jest.Mock;
  hasPlayServices: jest.Mock;
  signIn: jest.Mock;
  signOut: jest.Mock;
  getTokens: jest.Mock;
}

function loadModule(): { auth: GoogleAuthModule; GoogleSignin: GoogleSigninMock } {
  const auth = require('@/lib/google-auth') as GoogleAuthModule;
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  return { auth, GoogleSignin: GoogleSignin as unknown as GoogleSigninMock };
}

beforeEach(() => {
  jest.resetModules();
});

// ---------------------------------------------------------------------------
// signInWithGoogle
// ---------------------------------------------------------------------------

describe('signInWithGoogle', () => {
  it('calls configure on first invocation', async () => {
    const { auth, GoogleSignin } = loadModule();

    await auth.signInWithGoogle();

    expect(GoogleSignin.configure).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.configure).toHaveBeenCalledWith({
      scopes: ['https://www.googleapis.com/auth/drive'],
      offlineAccess: true,
    });
  });

  it('returns the email from the sign-in response', async () => {
    const { auth } = loadModule();

    const result = await auth.signInWithGoogle();

    expect(result).toEqual({ email: 'test@example.com' });
  });

  it('calls hasPlayServices before signIn', async () => {
    const { auth, GoogleSignin } = loadModule();

    await auth.signInWithGoogle();

    expect(GoogleSignin.hasPlayServices).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);

    const hasPlayOrder = GoogleSignin.hasPlayServices.mock.invocationCallOrder[0];
    const signInOrder = GoogleSignin.signIn.mock.invocationCallOrder[0];
    expect(hasPlayOrder).toBeLessThan(signInOrder);
  });

  it('throws when no email is returned', async () => {
    const { auth, GoogleSignin } = loadModule();
    GoogleSignin.signIn.mockResolvedValueOnce({
      data: { user: { email: null } },
    });

    await expect(auth.signInWithGoogle()).rejects.toThrow(
      'No email returned from Google Sign-In',
    );
  });

  it('throws when user data is missing entirely', async () => {
    const { auth, GoogleSignin } = loadModule();
    GoogleSignin.signIn.mockResolvedValueOnce({ data: null });

    await expect(auth.signInWithGoogle()).rejects.toThrow(
      'No email returned from Google Sign-In',
    );
  });
});

// ---------------------------------------------------------------------------
// signOutFromGoogle
// ---------------------------------------------------------------------------

describe('signOutFromGoogle', () => {
  it('calls GoogleSignin.signOut', async () => {
    const { auth, GoogleSignin } = loadModule();

    await auth.signOutFromGoogle();

    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// getGoogleAccessToken
// ---------------------------------------------------------------------------

describe('getGoogleAccessToken', () => {
  it('returns the access token', async () => {
    const { auth, GoogleSignin } = loadModule();

    const token = await auth.getGoogleAccessToken();

    expect(token).toBe('mock-access-token');
    expect(GoogleSignin.getTokens).toHaveBeenCalledTimes(1);
  });

  it('throws when no access token is available', async () => {
    const { auth, GoogleSignin } = loadModule();
    GoogleSignin.getTokens.mockResolvedValueOnce({
      accessToken: null,
      idToken: 'mock-id-token',
    });

    await expect(auth.getGoogleAccessToken()).rejects.toThrow(
      'No access token available',
    );
  });

  it('throws when access token is empty string', async () => {
    const { auth, GoogleSignin } = loadModule();
    GoogleSignin.getTokens.mockResolvedValueOnce({
      accessToken: '',
      idToken: 'mock-id-token',
    });

    await expect(auth.getGoogleAccessToken()).rejects.toThrow(
      'No access token available',
    );
  });
});

// ---------------------------------------------------------------------------
// ensureConfigured -- only configures once across multiple calls
// ---------------------------------------------------------------------------

describe('ensureConfigured (via public API)', () => {
  it('only calls configure once across multiple function calls', async () => {
    const { auth, GoogleSignin } = loadModule();

    await auth.signInWithGoogle();
    await auth.signOutFromGoogle();
    await auth.getGoogleAccessToken();

    expect(GoogleSignin.configure).toHaveBeenCalledTimes(1);
  });

  it('does not configure again on second call to the same function', async () => {
    const { auth, GoogleSignin } = loadModule();

    await auth.signInWithGoogle();
    await auth.signInWithGoogle();

    expect(GoogleSignin.configure).toHaveBeenCalledTimes(1);
  });
});

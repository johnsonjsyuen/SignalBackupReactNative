const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(() => Promise.resolve(true)),
  signIn: jest.fn(() =>
    Promise.resolve({
      data: { user: { email: 'test@example.com' } },
    })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  getTokens: jest.fn(() =>
    Promise.resolve({ accessToken: 'mock-access-token', idToken: 'mock-id-token' })
  ),
};

module.exports = { GoogleSignin };

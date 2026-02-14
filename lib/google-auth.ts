import { GoogleSignin } from '@react-native-google-signin/google-signin';

let isConfigured = false;

function ensureConfigured(): void {
  if (!isConfigured) {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive'],
      offlineAccess: true,
      webClientId:
        '708439544712-6gt7qbs1jq1domqp2tgrengkj9d5c8pg.apps.googleusercontent.com',
    });
    isConfigured = true;
  }
}

export async function signInWithGoogle(): Promise<{ email: string }> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  const email = response.data?.user?.email;
  if (!email) throw new Error('No email returned from Google Sign-In');

  return { email };
}

export async function signOutFromGoogle(): Promise<void> {
  ensureConfigured();
  await GoogleSignin.signOut();
}

export async function getGoogleAccessToken(): Promise<string> {
  ensureConfigured();
  const tokens = await GoogleSignin.getTokens();
  if (!tokens.accessToken) throw new Error('No access token available');
  return tokens.accessToken;
}

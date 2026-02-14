import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useUploadStatus } from '@/hooks/use-upload-status';

export function AuthSection() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isSignedIn, email, isLoading, error, signIn } = useGoogleAuth();
  const { status, startUpload, cancelUpload } = useUploadStatus();

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={signIn}
          disabled={isLoading}>
          <ThemedText style={[styles.buttonText, { color: colors.onPrimary }]}>
            {isLoading ? 'Signing in...' : 'Sign In with Google'}
          </ThemedText>
        </TouchableOpacity>
        {error ? <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.email}>Signed in as {email}</ThemedText>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={startUpload}
        disabled={status.kind === 'uploading'}>
        <ThemedText style={[styles.buttonText, { color: colors.onPrimary }]}>Upload Now</ThemedText>
      </TouchableOpacity>
      {status.kind === 'uploading' ? (
        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: colors.primary }]}
          onPress={cancelUpload}>
          <ThemedText style={[styles.outlineButtonText, { color: colors.primary }]}>Cancel Upload</ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 8,
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
});

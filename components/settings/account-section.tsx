import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGoogleAuth } from '@/hooks/use-google-auth';

export function AccountSection() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isSignedIn, email, signOut } = useGoogleAuth();

  return (
    <View>
      <ThemedText style={styles.sectionHeader}>ACCOUNT</ThemedText>

      <View style={styles.row}>
        <IconSymbol name="person.circle.fill" size={24} color={colors.icon} />
        <View style={styles.content}>
          <ThemedText style={styles.label}>{isSignedIn ? email : 'Not signed in'}</ThemedText>
        </View>
        {isSignedIn ? (
          <TouchableOpacity onPress={signOut}>
            <ThemedText style={[styles.action, { color: colors.error }]}>Sign Out</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.5,
    marginBottom: 4,
    marginLeft: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
  },
});

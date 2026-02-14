import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function AboutSection() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View>
      <ThemedText style={styles.sectionHeader}>ABOUT</ThemedText>

      <View style={styles.row}>
        <IconSymbol name="info.circle.fill" size={24} color={colors.icon} />
        <View style={styles.content}>
          <ThemedText style={styles.label}>Build Time</ThemedText>
          <ThemedText style={styles.status}>{new Date().toISOString().split('T')[0]}</ThemedText>
        </View>
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
  status: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
});

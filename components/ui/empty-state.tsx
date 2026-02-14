import { StyleSheet, View } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <ThemedText
        lightColor={Colors.light.secondary}
        darkColor={Colors.dark.secondary}
        style={styles.message}
      >
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    ...Typography.bodyLarge,
    textAlign: 'center',
  },
});

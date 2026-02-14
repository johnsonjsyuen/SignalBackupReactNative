import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCountdown } from '@/hooks/use-countdown';

interface CountdownCardProps {
  scheduleHour: number;
  scheduleMinute: number;
}

export function CountdownCard({ scheduleHour, scheduleMinute }: CountdownCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const countdown = useCountdown(scheduleHour, scheduleMinute);

  return (
    <Card variant="surface">
      <View style={styles.row}>
        <IconSymbol name="clock" size={24} color={colors.primary} />
        <View style={styles.textContainer}>
          <ThemedText style={styles.label}>Next upload</ThemedText>
          <ThemedText style={styles.countdown}>{countdown}</ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    opacity: 0.6,
  },
  countdown: {
    fontSize: 20,
    fontWeight: '600',
  },
});

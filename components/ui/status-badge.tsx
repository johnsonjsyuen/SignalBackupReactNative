import { StyleSheet, View, Text } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface StatusBadgeProps {
  status: 'SUCCESS' | 'FAILED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const successBg = useThemeColor({}, 'tertiary');
  const failedBg = useThemeColor({}, 'error');

  const backgroundColor = status === 'SUCCESS' ? successBg : failedBg;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

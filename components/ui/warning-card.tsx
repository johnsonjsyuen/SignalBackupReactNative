import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Card } from '@/components/ui/card';

interface WarningCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function WarningCard({
  title,
  description,
  actionLabel,
  onAction,
}: WarningCardProps) {
  const errorColor = useThemeColor({}, 'error');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <Card variant="error">
      <View style={styles.titleRow}>
        <IconSymbol
          name="exclamationmark.triangle.fill"
          size={20}
          color={errorColor}
        />
        <ThemedText style={styles.title}>{title}</ThemedText>
      </View>
      <ThemedText style={styles.description}>{description}</ThemedText>
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <ThemedText style={[styles.actionLabel, { color: primaryColor }]}>
          {actionLabel}
        </ThemedText>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

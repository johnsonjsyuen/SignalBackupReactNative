import { type ComponentProps } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ToggleRowProps {
  icon: ComponentProps<typeof IconSymbol>['name'];
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleRow({
  icon,
  label,
  description,
  value,
  onValueChange,
}: ToggleRowProps) {
  const iconColor = useThemeColor({}, 'secondary');
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.row}>
      <IconSymbol name={icon} size={24} color={iconColor} style={styles.icon} />
      <View style={styles.content}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {description ? (
          <ThemedText
            lightColor={Colors.light.secondary}
            darkColor={Colors.dark.secondary}
            style={styles.description}
          >
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.surfaceVariant,
          true: colors.primary,
        }}
        thumbColor={colors.cardBackground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});

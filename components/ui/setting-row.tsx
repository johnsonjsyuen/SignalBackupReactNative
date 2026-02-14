import { type ComponentProps } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface SettingRowProps {
  icon: ComponentProps<typeof IconSymbol>['name'];
  label: string;
  status?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}

export function SettingRow({
  icon,
  label,
  status,
  actionLabel,
  onAction,
  disabled = false,
}: SettingRowProps) {
  const iconColor = useThemeColor({}, 'secondary');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <View style={styles.row}>
      <IconSymbol name={icon} size={24} color={iconColor} style={styles.icon} />
      <View style={styles.content}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {status ? (
          <ThemedText
            lightColor={Colors.light.secondary}
            darkColor={Colors.dark.secondary}
            style={styles.status}
          >
            {status}
          </ThemedText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              styles.actionLabel,
              { color: primaryColor },
              disabled && styles.disabled,
            ]}
          >
            {actionLabel}
          </ThemedText>
        </TouchableOpacity>
      ) : null}
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
  status: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});

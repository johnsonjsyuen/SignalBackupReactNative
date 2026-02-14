import { type ComponentProps } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ChipProps {
  icon: ComponentProps<typeof IconSymbol>['name'];
  label: string;
  onPress?: () => void;
}

export function Chip({ icon, label, onPress }: ChipProps) {
  const backgroundColor = useThemeColor({}, 'surfaceVariant');
  const iconColor = useThemeColor({}, 'secondary');

  const content = (
    <View style={[styles.container, { backgroundColor }]}>
      <IconSymbol name={icon} size={16} color={iconColor} />
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
});

import { StyleSheet, View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CardProps extends ViewProps {
  variant?: 'default' | 'primary' | 'secondary' | 'error' | 'surface';
}

const VARIANT_COLOR_MAP = {
  default: 'cardBackground',
  primary: 'primaryContainer',
  secondary: 'secondaryContainer',
  error: 'errorContainer',
  surface: 'surfaceVariant',
} as const;

export function Card({ variant = 'default', style, ...rest }: CardProps) {
  const colorName = VARIANT_COLOR_MAP[variant];
  const backgroundColor = useThemeColor({}, colorName);

  return <View style={[styles.card, { backgroundColor }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
});

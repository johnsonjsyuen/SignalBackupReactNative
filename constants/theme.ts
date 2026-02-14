/**
 * Colors, fonts, and typography used throughout the app.
 * Light and dark mode palettes follow Material Design conventions.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#1A73E8',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#1A73E8',
    primary: '#1A73E8',
    secondary: '#5F6368',
    tertiary: '#34A853',
    error: '#EA4335',
    surfaceVariant: '#E8EAED',
    primaryContainer: '#D2E3FC',
    secondaryContainer: '#E8F0FE',
    errorContainer: '#FCE8E6',
    onPrimary: '#FFFFFF',
    onError: '#FFFFFF',
    border: '#DADCE0',
    cardBackground: '#FFFFFF',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#8AB4F8',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#8AB4F8',
    primary: '#8AB4F8',
    secondary: '#BDBDBD',
    tertiary: '#81C995',
    error: '#F28B82',
    surfaceVariant: '#3C4043',
    primaryContainer: '#174EA6',
    secondaryContainer: '#1A3A5C',
    errorContainer: '#601410',
    onPrimary: '#151718',
    onError: '#151718',
    border: '#5F6368',
    cardBackground: '#1E2022',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Typography = {
  titleLarge: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  titleMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelSmall: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};

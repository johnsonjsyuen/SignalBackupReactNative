// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'clock.fill': 'history',
  'gearshape.fill': 'settings',

  // Status indicators
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'error',
  'exclamationmark.triangle.fill': 'warning',
  'info.circle.fill': 'info',

  // Files and folders
  'folder.fill': 'folder',
  'folder.badge.gearshape': 'folder-open',

  // Connectivity and upload
  'wifi': 'wifi',
  'arrow.up.circle.fill': 'cloud-upload',

  // Scheduling
  'clock': 'schedule',
  'hourglass': 'hourglass-empty',

  // User and theme
  'person.circle.fill': 'account-circle',
  'sun.max.fill': 'light-mode',
  'moon.fill': 'dark-mode',
  'circle.lefthalf.filled': 'brightness-auto',

  // Actions
  'arrow.clockwise': 'refresh',
  'plus': 'add',
  'arrow.left': 'arrow-back',
  'xmark': 'close',

  // Misc
  'chevron.right': 'chevron-right',
  'chevron.left.forwardslash.chevron.right': 'code',
  'paperplane.fill': 'send',
} as IconMapping;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

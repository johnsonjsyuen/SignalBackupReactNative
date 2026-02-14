import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { SettingRow } from '@/components/ui/setting-row';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/hooks/use-settings';
import type { ThemeMode } from '@/types/settings';

const THEME_LABELS: Record<ThemeMode, string> = {
  SYSTEM: 'System default',
  LIGHT: 'Light',
  DARK: 'Dark',
};

const THEME_ICONS = {
  SYSTEM: 'circle.lefthalf.filled',
  LIGHT: 'sun.max.fill',
  DARK: 'moon.fill',
} as const;

export function AppearanceSection() {
  const { settings } = useSettings();
  const router = useRouter();

  return (
    <View>
      <ThemedText style={{ fontSize: 13, fontWeight: '600', opacity: 0.5, marginBottom: 4, marginLeft: 16 }}>
        APPEARANCE
      </ThemedText>

      <SettingRow
        icon={THEME_ICONS[settings.themeMode]}
        label="Theme"
        status={THEME_LABELS[settings.themeMode]}
        actionLabel="Change"
        onAction={() => router.push('/theme-picker')}
      />
    </View>
  );
}

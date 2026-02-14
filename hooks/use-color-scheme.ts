import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { SettingsContext } from '@/providers/settings-context';

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const { settings, isLoaded } = useContext(SettingsContext);

  if (!isLoaded || settings.themeMode === 'SYSTEM') {
    return systemScheme ?? 'light';
  }

  return settings.themeMode === 'DARK' ? 'dark' : 'light';
}

import { useContext } from 'react';

import { SettingsContext } from '@/providers/settings-context';

export function useSettings() {
  return useContext(SettingsContext);
}

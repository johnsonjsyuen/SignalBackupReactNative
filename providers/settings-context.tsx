import React, { createContext, useCallback, useEffect, useState, type PropsWithChildren } from 'react';

import { getSettings, setSetting } from '@/lib/storage';
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings';

interface SettingsContextValue {
  settings: Settings;
  isLoaded: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  updateSetting: async () => {},
});

const SETTINGS_KEY_TO_STORAGE_KEY: Record<keyof Settings, string> = {
  localFolderUri: 'local_folder_uri',
  driveFolderId: 'drive_folder_id',
  driveFolderName: 'drive_folder_name',
  scheduleHour: 'schedule_hour',
  scheduleMinute: 'schedule_minute',
  googleAccountEmail: 'google_account_email',
  themeMode: 'theme_mode',
  wifiOnly: 'wifi_only',
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
      setIsLoaded(true);
    });
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      const storageKey = SETTINGS_KEY_TO_STORAGE_KEY[key];
      await setSetting(storageKey, value as string | number | boolean | null);
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

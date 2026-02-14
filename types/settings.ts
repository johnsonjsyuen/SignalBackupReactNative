export type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

export interface Settings {
  localFolderUri: string | null;
  driveFolderId: string | null;
  driveFolderName: string | null;
  scheduleHour: number;
  scheduleMinute: number;
  googleAccountEmail: string | null;
  themeMode: ThemeMode;
  wifiOnly: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  localFolderUri: null,
  driveFolderId: null,
  driveFolderName: null,
  scheduleHour: 3,
  scheduleMinute: 0,
  googleAccountEmail: null,
  themeMode: 'SYSTEM',
  wifiOnly: false,
};

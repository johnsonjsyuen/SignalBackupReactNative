import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Directory } from 'expo-file-system';

import { SettingRow } from '@/components/ui/setting-row';
import { ToggleRow } from '@/components/ui/toggle-row';
import { WarningCard } from '@/components/ui/warning-card';
import { TimePickerModal } from '@/components/ui/time-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/hooks/use-settings';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { formatScheduleTime } from '@/lib/formatting';

export function ConfigSection() {
  const { settings, updateSetting } = useSettings();
  const { isSignedIn } = useGoogleAuth();
  const { hasExactAlarm, hasBatteryOptimization } = usePermissions();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const router = useRouter();

  const handleSelectLocalFolder = async () => {
    try {
      const dir = await Directory.pickDirectoryAsync();
      if (dir?.uri) {
        await updateSetting('localFolderUri', dir.uri);
      }
    } catch {
      // User cancelled or error
    }
  };

  const handleTimeConfirm = async (hour: number, minute: number) => {
    setShowTimePicker(false);
    await updateSetting('scheduleHour', hour);
    await updateSetting('scheduleMinute', minute);
  };

  const handleOpenAlarmSettings = async () => {
    const { openExactAlarmSettings } = await import('@/lib/platform');
    await openExactAlarmSettings();
  };

  const handleOpenBatterySettings = async () => {
    const { openBatteryOptimizationSettings } = await import('@/lib/platform');
    await openBatteryOptimizationSettings();
  };

  return (
    <View>
      <ThemedText style={{ fontSize: 13, fontWeight: '600', opacity: 0.5, marginBottom: 4, marginLeft: 16 }}>
        CONFIGURATION
      </ThemedText>

      <SettingRow
        icon="folder.fill"
        label="Local Backup Folder"
        status={settings.localFolderUri ? 'Folder selected' : 'Not set'}
        actionLabel="Select"
        onAction={handleSelectLocalFolder}
      />

      <SettingRow
        icon="arrow.up.circle.fill"
        label="Google Drive Folder"
        status={settings.driveFolderName ?? 'Not set'}
        actionLabel="Select"
        onAction={() => router.push('/drive-folder-picker')}
        disabled={!isSignedIn}
      />

      <SettingRow
        icon="clock"
        label="Upload Schedule"
        status={`Daily at ${formatScheduleTime(settings.scheduleHour, settings.scheduleMinute)}`}
        actionLabel="Change"
        onAction={() => setShowTimePicker(true)}
      />

      <ToggleRow
        icon="wifi"
        label="Wi-Fi only"
        description="Only upload when connected to Wi-Fi"
        value={settings.wifiOnly}
        onValueChange={(v) => updateSetting('wifiOnly', v)}
      />

      {Platform.OS === 'android' && !hasExactAlarm ? (
        <WarningCard
          title="Exact alarm permission required"
          description="Scheduled backups need permission to fire at the exact time."
          actionLabel="Grant"
          onAction={handleOpenAlarmSettings}
        />
      ) : null}

      {Platform.OS === 'android' && hasBatteryOptimization ? (
        <WarningCard
          title="Battery optimization active"
          description="Disable battery optimization so scheduled backups are not killed."
          actionLabel="Disable"
          onAction={handleOpenBatterySettings}
        />
      ) : null}

      <TimePickerModal
        visible={showTimePicker}
        hour={settings.scheduleHour}
        minute={settings.scheduleMinute}
        onConfirm={handleTimeConfirm}
        onCancel={() => setShowTimePicker(false)}
      />
    </View>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface PermissionState {
  hasExactAlarm: boolean;
  hasBatteryOptimization: boolean; // true = optimization is active (bad)
  hasNotifications: boolean;
}

export function usePermissions(): PermissionState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<PermissionState>({
    hasExactAlarm: Platform.OS !== 'android',
    hasBatteryOptimization: false,
    hasNotifications: false,
  });

  const refresh = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const { checkExactAlarmPermission, checkBatteryOptimization } = await import(
          '@/lib/platform'
        );
        const hasExactAlarm = await checkExactAlarmPermission();
        const hasBatteryOptimization = await checkBatteryOptimization();
        setState((prev) => ({ ...prev, hasExactAlarm, hasBatteryOptimization }));
      } catch {
        // Platform module may not be available yet
      }
    }

    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      setState((prev) => ({ ...prev, hasNotifications: status === 'granted' }));
    } catch {
      // Notifications not available
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

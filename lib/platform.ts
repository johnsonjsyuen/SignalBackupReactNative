import { Platform, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export async function isWifiConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.type === 'wifi' && state.isConnected === true;
}

export async function checkExactAlarmPermission(): Promise<boolean> {
  // On Android 12+ (API 31+), exact alarm permission may be needed.
  // Cannot reliably check this from JS without a native module.
  // Return true as default -- the app will show a warning if scheduling fails.
  if (Platform.OS !== 'android' || (Platform.Version as number) < 31) return true;
  return true;
}

export async function checkBatteryOptimization(): Promise<boolean> {
  // Returns true if battery optimization is ACTIVE (meaning we should warn the user).
  // Cannot reliably check this from JS without a native module.
  if (Platform.OS !== 'android') return false;
  return false;
}

export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await Linking.openSettings();
  }
}

export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await Linking.openSettings();
  }
}

import { Platform, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  isWifiConnected,
  checkExactAlarmPermission,
  checkBatteryOptimization,
  openExactAlarmSettings,
  openBatteryOptimizationSettings,
} from '@/lib/platform';

// Cast NetInfo.fetch to a jest mock for per-test configuration
const mockFetch = NetInfo.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// isWifiConnected
// ---------------------------------------------------------------------------

describe('isWifiConnected', () => {
  it('returns true when connected via wifi', async () => {
    mockFetch.mockResolvedValueOnce({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });

    const result = await isWifiConnected();

    expect(result).toBe(true);
  });

  it('returns false when connected via cellular', async () => {
    mockFetch.mockResolvedValueOnce({
      type: 'cellular',
      isConnected: true,
      isInternetReachable: true,
    });

    const result = await isWifiConnected();

    expect(result).toBe(false);
  });

  it('returns false when wifi but not connected', async () => {
    mockFetch.mockResolvedValueOnce({
      type: 'wifi',
      isConnected: false,
      isInternetReachable: false,
    });

    const result = await isWifiConnected();

    expect(result).toBe(false);
  });

  it('returns false when type is "none"', async () => {
    mockFetch.mockResolvedValueOnce({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    });

    const result = await isWifiConnected();

    expect(result).toBe(false);
  });

  it('returns false when isConnected is null', async () => {
    mockFetch.mockResolvedValueOnce({
      type: 'wifi',
      isConnected: null,
    });

    const result = await isWifiConnected();

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkExactAlarmPermission
// ---------------------------------------------------------------------------

describe('checkExactAlarmPermission', () => {
  it('returns true on iOS', async () => {
    (Platform as any).OS = 'ios';

    const result = await checkExactAlarmPermission();

    expect(result).toBe(true);
  });

  it('returns true on Android below API 31', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = 30;

    const result = await checkExactAlarmPermission();

    expect(result).toBe(true);
  });

  it('returns true on Android API 31+', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = 31;

    const result = await checkExactAlarmPermission();

    expect(result).toBe(true);
  });

  it('returns true on Android API 34', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = 34;

    const result = await checkExactAlarmPermission();

    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkBatteryOptimization
// ---------------------------------------------------------------------------

describe('checkBatteryOptimization', () => {
  it('returns false on iOS', async () => {
    (Platform as any).OS = 'ios';

    const result = await checkBatteryOptimization();

    expect(result).toBe(false);
  });

  it('returns false on Android', async () => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = 33;

    const result = await checkBatteryOptimization();

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// openExactAlarmSettings
// ---------------------------------------------------------------------------

describe('openExactAlarmSettings', () => {
  it('calls Linking.openSettings on Android', async () => {
    (Platform as any).OS = 'android';
    const openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValueOnce(undefined as any);

    await openExactAlarmSettings();

    expect(openSettingsSpy).toHaveBeenCalledTimes(1);
    openSettingsSpy.mockRestore();
  });

  it('does not call Linking.openSettings on iOS', async () => {
    (Platform as any).OS = 'ios';
    const openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValueOnce(undefined as any);

    await openExactAlarmSettings();

    expect(openSettingsSpy).not.toHaveBeenCalled();
    openSettingsSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// openBatteryOptimizationSettings
// ---------------------------------------------------------------------------

describe('openBatteryOptimizationSettings', () => {
  it('calls Linking.openSettings on Android', async () => {
    (Platform as any).OS = 'android';
    const openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValueOnce(undefined as any);

    await openBatteryOptimizationSettings();

    expect(openSettingsSpy).toHaveBeenCalledTimes(1);
    openSettingsSpy.mockRestore();
  });

  it('does not call Linking.openSettings on iOS', async () => {
    (Platform as any).OS = 'ios';
    const openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValueOnce(undefined as any);

    await openBatteryOptimizationSettings();

    expect(openSettingsSpy).not.toHaveBeenCalled();
    openSettingsSpy.mockRestore();
  });
});

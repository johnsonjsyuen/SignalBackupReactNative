import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { usePermissions } from '@/hooks/use-permissions';

// ---------------------------------------------------------------------------
// The hook uses dynamic import() for both '@/lib/platform' and
// 'expo-notifications'. Jest resolves dynamic import() to the same mocked
// modules when jest.mock() is called at the top level.
//
// The existing __mocks__/expo-notifications.js provides a getPermissionsAsync
// mock. We override it here to control the return value per test.
// ---------------------------------------------------------------------------

jest.mock('expo-notifications');
jest.mock('@/lib/platform');

// We need to import the mocks AFTER calling jest.mock so we get the
// mocked versions.
const Notifications = jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
const PlatformLib = jest.requireMock<typeof import('@/lib/platform')>('@/lib/platform');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePermissions', () => {
  beforeEach(() => {
    // Default to iOS so platform-specific code is opt-in per test.
    (Platform as any).OS = 'ios';

    // Reset mocks with sensible defaults.
    (PlatformLib.checkExactAlarmPermission as jest.Mock).mockReset().mockResolvedValue(true);
    (PlatformLib.checkBatteryOptimization as jest.Mock).mockReset().mockResolvedValue(false);
    (Notifications.getPermissionsAsync as jest.Mock).mockReset().mockResolvedValue({ status: 'granted' });
  });

  it('returns default state initially', () => {
    // Prevent the effect from resolving during this test.
    (Notifications.getPermissionsAsync as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePermissions());

    // On iOS, hasExactAlarm defaults to true (Platform.OS !== 'android').
    expect(result.current.hasExactAlarm).toBe(true);
    expect(result.current.hasBatteryOptimization).toBe(false);
    expect(result.current.hasNotifications).toBe(false);
  });

  it('sets hasNotifications to true when permission is granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.hasNotifications).toBe(true);
    });
  });

  it('sets hasNotifications to false when permission is not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    expect(result.current.hasNotifications).toBe(false);
  });

  it('checks alarm and battery permissions on Android', async () => {
    (Platform as any).OS = 'android';

    (PlatformLib.checkExactAlarmPermission as jest.Mock).mockResolvedValue(true);
    (PlatformLib.checkBatteryOptimization as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.hasExactAlarm).toBe(true);
      expect(result.current.hasBatteryOptimization).toBe(true);
    });

    expect(PlatformLib.checkExactAlarmPermission).toHaveBeenCalled();
    expect(PlatformLib.checkBatteryOptimization).toHaveBeenCalled();
  });

  it('does not check platform permissions on iOS', async () => {
    (Platform as any).OS = 'ios';

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.hasNotifications).toBe(true);
    });

    expect(PlatformLib.checkExactAlarmPermission).not.toHaveBeenCalled();
    expect(PlatformLib.checkBatteryOptimization).not.toHaveBeenCalled();
  });

  it('refresh() re-checks all permissions', async () => {
    (Platform as any).OS = 'android';
    (PlatformLib.checkExactAlarmPermission as jest.Mock).mockResolvedValue(false);
    (PlatformLib.checkBatteryOptimization as jest.Mock).mockResolvedValue(false);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(PlatformLib.checkExactAlarmPermission).toHaveBeenCalledTimes(1);
    });

    // Permissions change externally.
    (PlatformLib.checkExactAlarmPermission as jest.Mock).mockResolvedValue(true);
    (PlatformLib.checkBatteryOptimization as jest.Mock).mockResolvedValue(true);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.hasExactAlarm).toBe(true);
    expect(result.current.hasBatteryOptimization).toBe(true);
    expect(result.current.hasNotifications).toBe(true);
    expect(PlatformLib.checkExactAlarmPermission).toHaveBeenCalledTimes(2);
  });
});

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SettingsProvider, SettingsContext } from '@/providers/settings-context';
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings';

// ---------------------------------------------------------------------------
// Mock storage module.
// ---------------------------------------------------------------------------

jest.mock('@/lib/storage', () => ({
  getSettings: jest.fn(async () => ({ ...require('@/types/settings').DEFAULT_SETTINGS })),
  setSetting: jest.fn(async () => {}),
}));

import { getSettings, setSetting } from '@/lib/storage';

const mockedGetSettings = getSettings as jest.Mock;
const mockedSetSetting = setSetting as jest.Mock;

// ---------------------------------------------------------------------------
// Test consumer component that renders context values as text so we can
// query them with getByTestId.
// ---------------------------------------------------------------------------

function TestConsumer({
  onContext,
}: {
  onContext?: (ctx: {
    settings: Settings;
    isLoaded: boolean;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  }) => void;
}) {
  const ctx = React.useContext(SettingsContext);

  // Expose context to the test via callback ref.
  React.useEffect(() => {
    onContext?.(ctx);
  });

  return (
    <>
      <Text testID="isLoaded">{String(ctx.isLoaded)}</Text>
      <Text testID="themeMode">{ctx.settings.themeMode}</Text>
      <Text testID="scheduleHour">{String(ctx.settings.scheduleHour)}</Text>
      <Text testID="wifiOnly">{String(ctx.settings.wifiOnly)}</Text>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsProvider', () => {
  beforeEach(() => {
    mockedGetSettings.mockReset();
    mockedGetSettings.mockResolvedValue({ ...DEFAULT_SETTINGS });
    mockedSetSetting.mockReset();
    mockedSetSetting.mockResolvedValue(undefined);
  });

  it('provides DEFAULT_SETTINGS initially with isLoaded=false', () => {
    // Make getSettings hang so the effect never resolves during this assertion.
    mockedGetSettings.mockReturnValue(new Promise(() => {}));

    const { getByTestId } = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    expect(getByTestId('isLoaded').props.children).toBe('false');
    expect(getByTestId('themeMode').props.children).toBe(DEFAULT_SETTINGS.themeMode);
    expect(getByTestId('scheduleHour').props.children).toBe(
      String(DEFAULT_SETTINGS.scheduleHour),
    );
  });

  it('loads settings from storage and sets isLoaded to true', async () => {
    const customSettings: Settings = {
      ...DEFAULT_SETTINGS,
      themeMode: 'DARK',
      scheduleHour: 14,
      scheduleMinute: 30,
      wifiOnly: true,
    };
    mockedGetSettings.mockResolvedValue(customSettings);

    const { getByTestId } = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('isLoaded').props.children).toBe('true');
    });

    expect(getByTestId('themeMode').props.children).toBe('DARK');
    expect(getByTestId('scheduleHour').props.children).toBe('14');
    expect(getByTestId('wifiOnly').props.children).toBe('true');
  });

  it('updateSetting calls setSetting with the correct storage key and updates state', async () => {
    mockedGetSettings.mockResolvedValue({ ...DEFAULT_SETTINGS });

    let capturedCtx: any;

    const { getByTestId } = render(
      <SettingsProvider>
        <TestConsumer onContext={(ctx) => { capturedCtx = ctx; }} />
      </SettingsProvider>,
    );

    // Wait for initial load.
    await waitFor(() => {
      expect(getByTestId('isLoaded').props.children).toBe('true');
    });

    // Call updateSetting for themeMode.
    await act(async () => {
      await capturedCtx.updateSetting('themeMode', 'DARK');
    });

    // setSetting should have been called with the mapped storage key.
    expect(mockedSetSetting).toHaveBeenCalledWith('theme_mode', 'DARK');

    // The provider state should reflect the new value.
    expect(getByTestId('themeMode').props.children).toBe('DARK');
  });

  it('updateSetting maps wifiOnly to the correct storage key', async () => {
    mockedGetSettings.mockResolvedValue({ ...DEFAULT_SETTINGS });

    let capturedCtx: any;

    const { getByTestId } = render(
      <SettingsProvider>
        <TestConsumer onContext={(ctx) => { capturedCtx = ctx; }} />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('isLoaded').props.children).toBe('true');
    });

    await act(async () => {
      await capturedCtx.updateSetting('wifiOnly', true);
    });

    expect(mockedSetSetting).toHaveBeenCalledWith('wifi_only', true);
    expect(getByTestId('wifiOnly').props.children).toBe('true');
  });
});

import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { useSettings } from '@/hooks/use-settings';
import { SettingsContext } from '@/providers/settings-context';
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings';

// ---------------------------------------------------------------------------
// Helper: render the hook inside a SettingsContext provider.
// ---------------------------------------------------------------------------

function renderWithSettings(
  overrides: Partial<Settings> = {},
  isLoaded = true,
) {
  const value = {
    settings: { ...DEFAULT_SETTINGS, ...overrides },
    isLoaded,
    updateSetting: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(SettingsContext.Provider, { value }, children);

  return { ...renderHook(() => useSettings(), { wrapper }), contextValue: value };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSettings', () => {
  it('returns the context value from SettingsContext', () => {
    const { result, contextValue } = renderWithSettings(
      { themeMode: 'DARK', wifiOnly: true },
      true,
    );

    expect(result.current.settings).toEqual(contextValue.settings);
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.updateSetting).toBe(contextValue.updateSetting);
  });

  it('returns default values when no provider is present', () => {
    // Rendering without a wrapper uses the default context value.
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.isLoaded).toBe(false);
  });
});

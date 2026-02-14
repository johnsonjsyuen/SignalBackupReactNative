import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsContext } from '@/providers/settings-context';
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings';

// ---------------------------------------------------------------------------
// Mock react-native's useColorScheme. We cannot spread the entire
// react-native module because it triggers native TurboModule lookups.
// Instead we mock only the specific hook via the Appearance module that
// the hook re-exports internally.
// ---------------------------------------------------------------------------

const mockSystemScheme = jest.fn<'light' | 'dark' | null, []>(() => 'dark');

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockSystemScheme(...(args as [])),
}));

// ---------------------------------------------------------------------------
// Helper: render the hook inside a SettingsContext provider.
// ---------------------------------------------------------------------------

function renderWithSettings(
  settings: Partial<Settings> = {},
  isLoaded = true,
) {
  const value = {
    settings: { ...DEFAULT_SETTINGS, ...settings },
    isLoaded,
    updateSetting: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(SettingsContext.Provider, { value }, children);

  return renderHook(() => useColorScheme(), { wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useColorScheme', () => {
  beforeEach(() => {
    mockSystemScheme.mockReturnValue('dark');
  });

  it('returns system scheme when themeMode is SYSTEM', () => {
    const { result } = renderWithSettings({ themeMode: 'SYSTEM' });

    expect(result.current).toBe('dark');
  });

  it('returns "dark" when themeMode is DARK regardless of system scheme', () => {
    mockSystemScheme.mockReturnValue('light');

    const { result } = renderWithSettings({ themeMode: 'DARK' });

    expect(result.current).toBe('dark');
  });

  it('returns "light" when themeMode is LIGHT regardless of system scheme', () => {
    mockSystemScheme.mockReturnValue('dark');

    const { result } = renderWithSettings({ themeMode: 'LIGHT' });

    expect(result.current).toBe('light');
  });

  it('returns system scheme when settings are not yet loaded', () => {
    mockSystemScheme.mockReturnValue('dark');

    const { result } = renderWithSettings({ themeMode: 'LIGHT' }, false);

    // When isLoaded is false the hook falls through to systemScheme.
    expect(result.current).toBe('dark');
  });

  it('falls back to "light" when system scheme is null', () => {
    mockSystemScheme.mockReturnValue(null);

    const { result } = renderWithSettings({ themeMode: 'SYSTEM' });

    expect(result.current).toBe('light');
  });
});

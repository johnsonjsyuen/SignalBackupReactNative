# Project: SignalBackup (Expo React Native)

## Jest Setup
- **Jest 30 + jest-expo 54 compatibility**: The expo winter runtime (`expo/src/winter/runtime.native.ts`) installs lazy getters via `installGlobal` that call `require()` during setup phase. Jest 30 blocks this with `ReferenceError`. Fix: custom `jest-env.js` that pre-defines globals as non-configurable so expo skips the polyfill.
- `jest.config.js` had a typo `setupFilesAfterSetup` (invalid). Changed to `setupFilesAfterEnv`.
- `jest.setup.js` silences both `console.warn` and `console.error` (for polyfill skip messages).
- `jest-expo` setup.js (line 133) overrides `expo-file-system` mock, erasing the `__mocks__/expo-file-system.js` manual mock. Tests needing the File class must re-mock with `jest.doMock`.

## Testing Patterns
- **Module-scoped state (e.g., `database.ts` `let db`)**: Use `jest.resetModules()` + `require()` per test to get fresh module. Must also re-require the mock to get matching instances.
- **expo-file-system File mock**: Use `jest.doMock('expo-file-system', () => ({...}))` + `jest.resetModules()` per test variant, not top-level `jest.mock`.
- **AsyncStorage mock**: Has `__getStore()` and `__resetStore()` helpers. Call `__resetStore()` in `beforeEach`.
- **expo-sqlite mock**: Has `__mockDb` with `jest.fn()` methods. After `jest.resetModules()`, re-require to get the same mock instance the module under test uses.
- **jest.mock() hoisting**: Factory functions are hoisted above all other statements by babel-jest. Classes/variables defined outside the factory are NOT available inside it. Define mock classes inside the factory, extract them via `jest.requireMock()`.
- **Module-level side effects**: To verify side effects that happen at import time (e.g., `Notifications.setNotificationHandler`), capture mock state BEFORE `beforeEach/clearAllMocks` can run.
- **Closure-based state (e.g., `isConfigured` in google-auth)**: Use `jest.resetModules()` in `beforeEach` + inline `require()` per test to get a fresh module closure. Import the mock dependency from the same `require()` call to get the matching instance.

## Hook & Provider Testing
- **Dynamic import()**: jest 30 node env doesn't support `import()` without --experimental-vm-modules. Fixed via `jest-babel-dynamic-import.js` babel plugin in jest config.
- **react-native mock**: Never spread `jest.requireActual('react-native')` -- triggers native TurboModule lookups. Mock specific internal paths (e.g., `react-native/Libraries/Utilities/useColorScheme`).
- **Pressable onPress**: In RNTL v13, use `fireEvent.press(element)` not `element.props.onPress()`.
- **Fake timers + formatCountdown**: `jest.advanceTimersByTime(ms)` also advances `Date.now()`. Account for this when asserting time-based displays.
- **Provider tests**: Render a `TestConsumer` that reads context and renders values as `<Text testID="...">`. Use `fireEvent.press()` for actions, `waitFor` for async state updates.
- **Permission hooks with dynamic imports**: Use `jest.mock()` + `jest.requireMock()` for type-safe mock access. Set `Platform.OS` in `beforeEach`.

## Key File Paths
- Mocks: `__mocks__/` (async-storage, expo-sqlite, expo-file-system, netinfo, etc.)
- Tests: `__tests__/lib/`
- Source: `lib/` (formatting, storage, upload-session, md5, platform, database, etc.)
- Types: `types/` (settings, drive, upload)
- Constants: `constants/` (storage-keys, upload)

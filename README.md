# Signal Backup

A React Native (Expo) app that automatically backs up Signal Messenger `.backup` files to Google Drive on a daily schedule, with manual upload support.

## Features

- **Automated daily backups** - Schedule uploads at a chosen time (default 3:00 AM)
- **Google Drive integration** - Sign in with Google and pick a target Drive folder
- **Resumable uploads** - Chunked uploads that survive app kills, reboots, and network loss
- **Upload history** - Track past uploads with status, file size, and timestamps
- **Background processing** - Uploads continue via foreground service with progress notification
- **Duplicate detection** - Skips re-uploading identical backups already on Drive
- **Wi-Fi only mode** - Optionally restrict uploads to Wi-Fi connections
- **Theming** - Light, dark, and system-default themes
- **Local folder picker** - Select your Signal backup folder via system file picker
- **Drive folder browser** - Browse and create folders in Google Drive from within the app
- **Retry logic** - Automatic retries with exponential backoff; 30-minute delayed retry after final failure

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- Xcode (for iOS builds, macOS only)

### Android SDK

Add to your shell profile (`~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Or create `android/local.properties`:

```properties
sdk.dir=/Users/<your-username>/Library/Android/sdk
```

### JDK 17 (Android builds)

Android builds require **JDK 17** (Temurin recommended). GraalVM JDKs will cause `jlink` failures during compilation.

Using [SDKMAN](https://sdkman.io/):

```bash
sdk install java 17.0.13-tem
sdk default java 17.0.13-tem
```

If switching from a different JDK, clear the Gradle transform cache:

```bash
rm -rf ~/.gradle/caches/*/transforms
```

## Getting Started

Install dependencies:

```bash
cd SignalBackup
npm install
```

## Building for Android

### Development build (APK)

Generate the native Android project and build a debug APK:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`. Install it on a device or emulator:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Release build (APK)

Generate a signed release APK:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`. Install it:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### One-step build and run

Build and install directly to a connected device or emulator:

```bash
npx expo run:android
```

### EAS Build (cloud)

For cloud-based builds via Expo Application Services:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This requires an `eas.json` with an APK profile:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Building for iOS

### Simulator build

Generate the native iOS project and run on the iOS Simulator (macOS only):

```bash
npx expo run:ios
```

### Device build

To run on a physical iOS device, you need an Apple Developer account and provisioning profile:

```bash
npx expo run:ios --device
```

### EAS Build (cloud)

```bash
eas build --platform ios --profile development
```

For TestFlight / App Store distribution:

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

## Using Expo Go

For quick iteration without native builds, start the Expo development server:

```bash
npx expo start
```

Then scan the QR code with the [Expo Go](https://expo.dev/go) app on your device. Note that Expo Go has limitations - features requiring native modules (like Google Sign-In and background tasks) will not work. Use a development build for full functionality.

## Project Structure

```
app/
  (tabs)/
    _layout.tsx        # Tab navigation layout
    index.tsx          # Home screen (status, upload controls)
    history.tsx        # Upload history list
    settings.tsx       # Configuration & preferences
  drive-folder-picker.tsx  # Google Drive folder browser
  theme-picker.tsx         # Theme selection
```

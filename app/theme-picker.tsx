import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/hooks/use-settings';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ThemeMode } from '@/types/settings';

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'LIGHT', label: 'Light' },
  { mode: 'DARK', label: 'Dark' },
  { mode: 'SYSTEM', label: 'System default' },
];

export default function ThemePickerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const backgroundColor = useThemeColor({}, 'background');
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  const handleSelect = async (mode: ThemeMode) => {
    await updateSetting('themeMode', mode);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {OPTIONS.map((option) => {
        const isSelected = settings.themeMode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={styles.option}
            onPress={() => handleSelect(option.mode)}>
            <View
              style={[
                styles.radio,
                { borderColor: isSelected ? colors.primary : colors.secondary },
              ]}>
              {isSelected ? (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              ) : null}
            </View>
            <ThemedText style={styles.label}>{option.label}</ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 16,
  },
});

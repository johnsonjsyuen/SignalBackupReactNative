import { ScrollView, StyleSheet } from 'react-native';

import { ConfigSection } from '@/components/settings/config-section';
import { AppearanceSection } from '@/components/settings/appearance-section';
import { AccountSection } from '@/components/settings/account-section';
import { AboutSection } from '@/components/settings/about-section';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsScreen() {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <ConfigSection />
      <AppearanceSection />
      <AccountSection />
      <AboutSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    gap: 24,
    paddingBottom: 32,
  },
});

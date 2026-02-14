import { ScrollView, StyleSheet } from 'react-native';

import { StatusCard } from '@/components/home/status-card';
import { ProgressCard } from '@/components/home/progress-card';
import { CountdownCard } from '@/components/home/countdown-card';
import { FolderChips } from '@/components/home/folder-chips';
import { AuthSection } from '@/components/home/auth-section';
import { useSettings } from '@/hooks/use-settings';
import { useUploadStatus } from '@/hooks/use-upload-status';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const { settings } = useSettings();
  const { status, progress } = useUploadStatus();

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <StatusCard status={status} />

      {status.kind === 'uploading' && progress ? <ProgressCard progress={progress} /> : null}

      <CountdownCard scheduleHour={settings.scheduleHour} scheduleMinute={settings.scheduleMinute} />

      <FolderChips />

      <AuthSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});

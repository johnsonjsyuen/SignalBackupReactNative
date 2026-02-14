import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { formatFileSize, formatSpeed, formatEta } from '@/lib/formatting';
import type { UploadProgress } from '@/types/upload';

interface ProgressCardProps {
  progress: UploadProgress;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  const fraction = progress.totalBytes > 0 ? progress.bytesUploaded / progress.totalBytes : 0;
  const percent = Math.round(fraction * 100);

  return (
    <Card variant="default">
      <View style={styles.header}>
        <ThemedText style={styles.percent}>{percent}%</ThemedText>
        <ThemedText style={styles.bytes}>
          {formatFileSize(progress.bytesUploaded)} / {formatFileSize(progress.totalBytes)}
        </ThemedText>
      </View>
      <ProgressBar progress={fraction} />
      <View style={styles.footer}>
        <ThemedText style={styles.detail}>{formatSpeed(progress.speedBytesPerSec)}</ThemedText>
        <ThemedText style={styles.detail}>{formatEta(progress.estimatedSecondsRemaining)}</ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  percent: {
    fontSize: 20,
    fontWeight: '600',
  },
  bytes: {
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detail: {
    fontSize: 12,
    opacity: 0.6,
  },
});

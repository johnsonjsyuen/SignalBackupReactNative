import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatFileSize } from '@/lib/formatting';
import type { UploadStatus } from '@/types/upload';

interface StatusCardProps {
  status: UploadStatus;
}

export function StatusCard({ status }: StatusCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const config = getStatusConfig(status, colors);

  return (
    <Card variant={config.variant}>
      <View style={styles.row}>
        {config.showSpinner ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <IconSymbol name={config.icon as any} size={24} color={config.iconColor} />
        )}
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>{config.title}</ThemedText>
          {config.subtitle ? (
            <ThemedText style={[styles.subtitle, config.subtitleColor ? { color: config.subtitleColor } : undefined]}>
              {config.subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function getStatusConfig(
  status: UploadStatus,
  colors: (typeof Colors)['light']
): {
  variant: 'surface' | 'secondary' | 'primary' | 'error';
  icon: string;
  iconColor: string;
  showSpinner: boolean;
  title: string;
  subtitle?: string;
  subtitleColor?: string;
} {
  switch (status.kind) {
    case 'idle':
      return {
        variant: 'surface',
        icon: 'hourglass',
        iconColor: colors.secondary,
        showSpinner: false,
        title: 'No upload in progress',
      };
    case 'uploading':
      return {
        variant: 'secondary',
        icon: '',
        iconColor: colors.primary,
        showSpinner: true,
        title: 'Uploading backup...',
      };
    case 'success':
      return {
        variant: 'primary',
        icon: 'checkmark.circle.fill',
        iconColor: colors.tertiary,
        showSpinner: false,
        title: 'Upload successful',
        subtitle: `${status.fileName} (${formatFileSize(status.fileSizeBytes)})`,
      };
    case 'failed':
      return {
        variant: 'error',
        icon: 'xmark.circle.fill',
        iconColor: colors.error,
        showSpinner: false,
        title: 'Upload failed',
        subtitle: status.error,
        subtitleColor: colors.error,
      };
    case 'needs-consent':
      return {
        variant: 'secondary',
        icon: '',
        iconColor: colors.primary,
        showSpinner: true,
        title: 'Requesting Drive permission...',
      };
    case 'retry-scheduled':
      return {
        variant: 'error',
        icon: 'arrow.clockwise',
        iconColor: colors.error,
        showSpinner: false,
        title: 'Retry scheduled',
        subtitle: status.error,
        subtitleColor: colors.error,
      };
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

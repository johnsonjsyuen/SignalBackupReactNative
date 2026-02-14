import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatFileSize, formatTimestamp } from '@/lib/formatting';
import type { UploadRecord } from '@/types/upload';

interface HistoryItemProps {
  record: UploadRecord;
}

export function HistoryItem({ record }: HistoryItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const isSuccess = record.status === 'SUCCESS';

  return (
    <Card variant="default">
      <View style={styles.row}>
        <IconSymbol
          name={isSuccess ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
          size={24}
          color={isSuccess ? colors.tertiary : colors.error}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.fileName} numberOfLines={1}>
              {record.fileName}
            </ThemedText>
            <StatusBadge status={record.status} />
          </View>
          <ThemedText style={styles.timestamp}>{formatTimestamp(record.timestamp)}</ThemedText>
          <ThemedText style={styles.fileSize}>{formatFileSize(record.fileSizeBytes)}</ThemedText>
          {record.errorMessage ? (
            <ThemedText style={[styles.error, { color: colors.error }]}>{record.errorMessage}</ThemedText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  fileSize: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  error: {
    fontSize: 13,
    marginTop: 4,
  },
});

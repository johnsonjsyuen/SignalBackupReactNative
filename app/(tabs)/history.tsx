import { FlatList, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { HistoryItem } from '@/components/history/history-item';
import { useUploadHistory } from '@/hooks/use-upload-history';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { UploadRecord } from '@/types/upload';

export default function HistoryScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const { records } = useUploadHistory();

  if (records.length === 0) {
    return <EmptyState message="No upload history yet" />;
  }

  return (
    <FlatList<UploadRecord>
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      data={records}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <HistoryItem record={item} />}
    />
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

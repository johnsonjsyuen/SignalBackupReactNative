import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip } from '@/components/ui/chip';
import { useSettings } from '@/hooks/use-settings';

export function FolderChips() {
  const { settings } = useSettings();
  const router = useRouter();

  const navigateToSettings = () => {
    router.navigate('/(tabs)/settings');
  };

  return (
    <View style={styles.container}>
      <Chip
        icon="folder.fill"
        label={settings.localFolderUri ? 'Folder selected' : 'No local folder'}
        onPress={navigateToSettings}
      />
      <Chip
        icon="folder.badge.gearshape"
        label={settings.driveFolderName ?? 'No Drive folder'}
        onPress={navigateToSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginVertical: 8,
  },
});

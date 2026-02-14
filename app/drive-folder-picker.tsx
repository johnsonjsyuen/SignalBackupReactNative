import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useSettings } from '@/hooks/use-settings';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { DriveFolder } from '@/types/drive';

export default function DriveFolderPickerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const backgroundColor = useThemeColor({}, 'background');
  const router = useRouter();
  const { getAccessToken } = useGoogleAuth();
  const { updateSetting } = useSettings();

  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [currentFolderName, setCurrentFolderName] = useState('My Drive');
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadFolders = useCallback(
    async (parentId: string) => {
      setIsLoading(true);
      try {
        const token = await getAccessToken();
        const { listFolders } = await import('@/lib/drive-api');
        const result = await listFolders(parentId, token);
        setFolders(result);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    loadFolders(currentFolderId);
  }, [currentFolderId, loadFolders]);

  const navigateInto = (folder: DriveFolder) => {
    setFolderStack((prev) => [...prev, { id: currentFolderId, name: currentFolderName }]);
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
  };

  const navigateBack = () => {
    const prev = folderStack[folderStack.length - 1];
    if (prev) {
      setFolderStack((stack) => stack.slice(0, -1));
      setCurrentFolderId(prev.id);
      setCurrentFolderName(prev.name);
    }
  };

  const selectFolder = async () => {
    await updateSetting('driveFolderId', currentFolderId);
    await updateSetting('driveFolderName', currentFolderName);
    router.back();
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const token = await getAccessToken();
      const { createFolder: apiCreate } = await import('@/lib/drive-api');
      await apiCreate(newFolderName.trim(), currentFolderId, token);
      setNewFolderName('');
      setShowNewFolder(false);
      loadFolders(currentFolderId);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create folder');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        {folderStack.length > 0 ? (
          <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
            <IconSymbol name="arrow.left" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <ThemedText style={styles.title} numberOfLines={1}>
          {currentFolderName}
        </ThemedText>
        <TouchableOpacity onPress={() => setShowNewFolder(true)} style={styles.addButton}>
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showNewFolder ? (
        <View style={[styles.newFolderRow, { borderColor: colors.border }]}>
          <TextInput
            style={[styles.newFolderInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Folder name"
            placeholderTextColor={colors.secondary}
            value={newFolderName}
            onChangeText={setNewFolderName}
            autoFocus
          />
          <TouchableOpacity onPress={createFolder}>
            <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Create</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowNewFolder(false)}>
            <ThemedText style={{ color: colors.secondary }}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : folders.length === 0 ? (
        <ThemedText style={styles.empty}>No folders</ThemedText>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.folderRow} onPress={() => navigateInto(item)}>
              <IconSymbol name="folder.fill" size={24} color={colors.primary} />
              <ThemedText style={styles.folderName}>{item.name}</ThemedText>
              <IconSymbol name="chevron.right" size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: colors.primary }]}
          onPress={selectFolder}>
          <ThemedText style={[styles.selectButtonText, { color: colors.onPrimary }]}>
            Select This Folder
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <ThemedText style={{ color: colors.secondary, fontWeight: '600' }}>Cancel</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  newFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  newFolderInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
  list: {
    flex: 1,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    gap: 8,
  },
  selectButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});

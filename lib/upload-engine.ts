import { File, Directory, Paths } from 'expo-file-system';
import { getSettings } from '@/lib/storage';
import { insertUploadRecord } from '@/lib/database';
import * as DriveApi from '@/lib/drive-api';
import * as UploadSession from '@/lib/upload-session';
import { computeFileMd5 } from '@/lib/md5';
import { isWifiConnected } from '@/lib/platform';
import { getGoogleAccessToken } from '@/lib/google-auth';
import { UploadConstants } from '@/constants/upload';
import type { UploadProgress } from '@/types/upload';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface UploadCallbacks {
  onProgress: (progress: UploadProgress) => void;
  isCancelled: () => boolean;
}

interface UploadResult {
  success: boolean;
  fileName?: string;
  fileSizeBytes?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Main entry point -- 7-phase upload orchestrator
// ---------------------------------------------------------------------------

export async function performUpload(
  callbacks: UploadCallbacks,
): Promise<UploadResult> {
  const startTime = Date.now();

  try {
    const token = await getGoogleAccessToken();

    // Phase 1: Read configuration
    const settings = await getSettings();
    if (!settings.localFolderUri) throw new Error('Local backup folder not set');
    if (!settings.driveFolderId) throw new Error('Google Drive folder not set');

    // Phase 2: Check for a saved resume session
    const savedSession = await UploadSession.loadSession();

    if (
      savedSession &&
      !UploadSession.isSessionExpired(savedSession) &&
      savedSession.driveFolderId === settings.driveFolderId
    ) {
      try {
        const progress = await DriveApi.queryUploadProgress(
          savedSession.sessionUri,
          savedSession.totalBytes,
        );

        if (progress.done) {
          // Upload already completed (crash recovery path)
          await UploadSession.clearSession();
          insertUploadRecord({
            timestamp: Date.now(),
            fileName: savedSession.fileName,
            fileSizeBytes: savedSession.totalBytes,
            status: 'SUCCESS',
            errorMessage: null,
            driveFolderId: settings.driveFolderId,
            driveFileId: progress.driveFileId ?? null,
          });
          return {
            success: true,
            fileName: savedSession.fileName,
            fileSizeBytes: savedSession.totalBytes,
          };
        }

        // Resume from the last confirmed offset
        return await uploadChunks(
          savedSession.sessionUri,
          savedSession.localFileUri,
          savedSession.fileName,
          progress.bytesConfirmed,
          savedSession.totalBytes,
          settings.driveFolderId,
          settings.wifiOnly,
          startTime,
          callbacks,
        );
      } catch {
        // Session is no longer valid -- start fresh
        await UploadSession.clearSession();
      }
    } else if (savedSession) {
      // Session exists but is expired or targets a different folder
      await UploadSession.clearSession();
    }

    // Phase 3: Find the latest backup file
    const folderDir = new Directory(settings.localFolderUri);
    const entries = folderDir.list();
    const backupFiles = entries.filter(
      (entry): entry is File =>
        entry instanceof File &&
        entry.uri.endsWith(UploadConstants.BACKUP_FILE_EXTENSION),
    );

    if (backupFiles.length === 0) throw new Error('No backup files found');

    // Sort by modification time descending to get the latest backup
    backupFiles.sort((a, b) => (b.modificationTime ?? 0) - (a.modificationTime ?? 0));

    const sourceFile = backupFiles[0];
    if (!sourceFile.exists) throw new Error('Backup file not accessible');

    const fileSize = sourceFile.size;
    const fileName = sourceFile.uri.split('/').pop() ?? 'signal.backup';

    if (callbacks.isCancelled()) return { success: false, error: 'Cancelled' };

    // Phase 4: Check for duplicates on Drive
    const existing = await DriveApi.findFile(
      fileName,
      settings.driveFolderId,
      token,
    );

    if (existing && existing.size === fileSize) {
      insertUploadRecord({
        timestamp: Date.now(),
        fileName,
        fileSizeBytes: fileSize,
        status: 'SUCCESS',
        errorMessage: null,
        driveFolderId: settings.driveFolderId,
        driveFileId: existing.id,
      });
      return { success: true, fileName, fileSizeBytes: fileSize };
    }

    if (callbacks.isCancelled()) return { success: false, error: 'Cancelled' };

    // Phase 5: Initiate a resumable upload session
    const sessionUri = await DriveApi.initiateResumableUpload(
      fileName,
      settings.driveFolderId,
      fileSize,
      token,
    );

    // Copy file to cache for reliable random reads (SAF URIs may be unreliable
    // for repeated random access).
    const cacheFile = new File(Paths.cache, fileName);
    try {
      sourceFile.copy(cacheFile);
    } catch {
      throw new Error('Failed to copy backup file to cache');
    }

    await UploadSession.saveSession({
      sessionUri,
      localFileUri: cacheFile.uri,
      fileName,
      bytesUploaded: 0,
      totalBytes: fileSize,
      driveFolderId: settings.driveFolderId,
      createdAtMillis: Date.now(),
      driveFileId: null,
    });

    // Phases 6 & 7: Upload chunks and verify
    return await uploadChunks(
      sessionUri,
      cacheFile.uri,
      fileName,
      0,
      fileSize,
      settings.driveFolderId,
      settings.wifiOnly,
      startTime,
      callbacks,
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Upload failed';
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Internal: chunked upload loop (Phase 6) with MD5 verification (Phase 7)
// ---------------------------------------------------------------------------

async function uploadChunks(
  sessionUri: string,
  cachedFileUri: string,
  fileName: string,
  startOffset: number,
  totalBytes: number,
  driveFolderId: string,
  wifiOnly: boolean,
  startTime: number,
  callbacks: UploadCallbacks,
): Promise<UploadResult> {
  let bytesUploaded = startOffset;
  let noProgressCount = 0;
  let chunkCount = 0;

  const cachedFile = new File(cachedFileUri);
  if (!cachedFile.exists) {
    throw new Error('Cached backup file not found -- cannot resume');
  }

  const handle = cachedFile.open();

  try {
    while (bytesUploaded < totalBytes) {
      if (callbacks.isCancelled()) {
        return { success: false, error: 'Cancelled' };
      }

      // Periodic Wi-Fi check
      if (wifiOnly && chunkCount % UploadConstants.WIFI_CHECK_INTERVAL === 0) {
        const wifi = await isWifiConnected();
        if (!wifi) throw new Error('Wi-Fi connection lost');
      }

      const chunkSize = Math.min(
        UploadConstants.CHUNK_SIZE,
        totalBytes - bytesUploaded,
      );
      const chunkEnd = bytesUploaded + chunkSize - 1;

      // Seek to the correct offset and read a chunk
      handle.offset = bytesUploaded;
      const bytes = handle.readBytes(chunkSize);

      const result = await DriveApi.uploadChunk(
        sessionUri,
        bytes,
        bytesUploaded,
        chunkEnd,
        totalBytes,
      );

      // Stall detection
      if (result.bytesConfirmed <= bytesUploaded && !result.done) {
        noProgressCount++;
        if (noProgressCount >= UploadConstants.MAX_NO_PROGRESS_RETRIES) {
          throw new Error('Upload stalled: no progress after retries');
        }
        continue;
      }

      noProgressCount = 0;
      bytesUploaded = result.done ? totalBytes : result.bytesConfirmed;
      chunkCount++;

      // Persist progress for crash recovery
      await UploadSession.updateBytesUploaded(bytesUploaded);

      // Report progress to the UI
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? bytesUploaded / elapsed : 0;
      const remaining =
        speed > 0 ? (totalBytes - bytesUploaded) / speed : -1;

      callbacks.onProgress({
        bytesUploaded,
        totalBytes,
        speedBytesPerSec: Math.round(speed),
        estimatedSecondsRemaining: Math.round(remaining),
      });

      if (result.done) {
        handle.close();

        // Phase 7: MD5 verification
        try {
          const localMd5 = computeFileMd5(cachedFileUri);
          if (result.md5Checksum && localMd5 !== result.md5Checksum) {
            throw new Error('MD5 checksum mismatch');
          }
        } catch (md5Error: unknown) {
          // Re-throw if it is a genuine mismatch; otherwise swallow (non-critical)
          if (
            md5Error instanceof Error &&
            md5Error.message === 'MD5 checksum mismatch'
          ) {
            throw md5Error;
          }
        }

        await UploadSession.clearSession();

        insertUploadRecord({
          timestamp: Date.now(),
          fileName,
          fileSizeBytes: totalBytes,
          status: 'SUCCESS',
          errorMessage: null,
          driveFolderId,
          driveFileId: result.driveFileId ?? null,
        });

        // Clean up cached copy
        try { cachedFile.delete(); } catch { /* best effort */ }
        return { success: true, fileName, fileSizeBytes: totalBytes };
      }
    }

    handle.close();

    // Reached totalBytes without an explicit "done" -- treat as success
    try { cachedFile.delete(); } catch { /* best effort */ }
    return { success: true, fileName, fileSizeBytes: totalBytes };
  } catch (e) {
    handle.close();
    // Do NOT clean up the cache on error -- the session may be resumed later
    throw e;
  }
}

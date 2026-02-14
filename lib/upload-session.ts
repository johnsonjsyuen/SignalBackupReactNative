import {
  getResumeSession,
  saveResumeSession,
  clearResumeSession,
} from '@/lib/storage';
import { UploadConstants } from '@/constants/upload';
import type { ResumableUploadSession } from '@/types/drive';

export async function loadSession(): Promise<ResumableUploadSession | null> {
  return getResumeSession();
}

export async function saveSession(session: ResumableUploadSession): Promise<void> {
  return saveResumeSession(session);
}

export async function clearSession(): Promise<void> {
  return clearResumeSession();
}

export function isSessionExpired(session: ResumableUploadSession): boolean {
  return Date.now() - session.createdAtMillis > UploadConstants.SESSION_MAX_AGE_MS;
}

export async function updateBytesUploaded(bytes: number): Promise<void> {
  const session = await loadSession();
  if (session) {
    await saveResumeSession({ ...session, bytesUploaded: bytes });
  }
}

import * as SQLite from 'expo-sqlite';
import { UploadRecord } from '@/types/upload';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): void {
  db = SQLite.openDatabaseSync('signalbackup.db');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS upload_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      fileName TEXT NOT NULL,
      fileSizeBytes INTEGER NOT NULL,
      status TEXT NOT NULL,
      errorMessage TEXT,
      driveFolderId TEXT NOT NULL,
      driveFileId TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_upload_history_timestamp ON upload_history(timestamp);
  `);
}

export function insertUploadRecord(record: Omit<UploadRecord, 'id'>): void {
  getDb().runSync(
    `INSERT INTO upload_history (timestamp, fileName, fileSizeBytes, status, errorMessage, driveFolderId, driveFileId)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      record.timestamp,
      record.fileName,
      record.fileSizeBytes,
      record.status,
      record.errorMessage,
      record.driveFolderId,
      record.driveFileId,
    ],
  );
}

export function getAllUploadRecords(): UploadRecord[] {
  return getDb().getAllSync<UploadRecord>(
    'SELECT * FROM upload_history ORDER BY timestamp DESC',
  );
}

export function getLatestUploadRecord(): UploadRecord | null {
  return (
    getDb().getFirstSync<UploadRecord>(
      'SELECT * FROM upload_history ORDER BY timestamp DESC LIMIT 1',
    ) ?? null
  );
}

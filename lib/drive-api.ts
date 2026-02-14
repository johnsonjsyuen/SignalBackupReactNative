import { UploadConstants } from '@/constants/upload';
import type { DriveFolder } from '@/types/drive';

// ---------------------------------------------------------------------------
// Base URLs
// ---------------------------------------------------------------------------

const BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

// ---------------------------------------------------------------------------
// Shared request helper
// ---------------------------------------------------------------------------

async function driveRequest(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive API error ${res.status}: ${body}`);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Folder operations
// ---------------------------------------------------------------------------

export async function listFolders(
  parentId: string,
  token: string,
): Promise<DriveFolder[]> {
  const safeParentId = parentId.replace(/'/g, "\\'");
  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and trashed=false and '${safeParentId}' in parents`,
  );
  const fields = encodeURIComponent('files(id,name)');

  const res = await driveRequest(
    `/files?q=${query}&fields=${fields}&orderBy=name`,
    token,
  );
  const data = await res.json();
  return (data.files ?? []) as DriveFolder[];
}

export async function createFolder(
  name: string,
  parentId: string,
  token: string,
): Promise<DriveFolder> {
  const res = await driveRequest('/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  const data = await res.json();
  return { id: data.id, name: data.name } as DriveFolder;
}

// ---------------------------------------------------------------------------
// File lookup
// ---------------------------------------------------------------------------

export async function findFile(
  fileName: string,
  folderId: string,
  token: string,
): Promise<{ id: string; size: number } | null> {
  const safeName = fileName.replace(/'/g, "\\'");
  const safeFolderId = folderId.replace(/'/g, "\\'");
  const query = encodeURIComponent(
    `name='${safeName}' and '${safeFolderId}' in parents and trashed=false`,
  );
  const fields = encodeURIComponent('files(id,size)');

  const res = await driveRequest(`/files?q=${query}&fields=${fields}`, token);
  const data = await res.json();

  const files = data.files as Array<{ id: string; size?: string }> | undefined;
  if (!files || files.length === 0) return null;

  return { id: files[0].id, size: Number(files[0].size ?? 0) };
}

// ---------------------------------------------------------------------------
// Resumable upload initiation
// ---------------------------------------------------------------------------

export async function initiateResumableUpload(
  fileName: string,
  folderId: string,
  totalBytes: number,
  token: string,
): Promise<string> {
  const url = `${UPLOAD_BASE}/files?uploadType=resumable`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': UploadConstants.MIME_TYPE,
      'X-Upload-Content-Length': String(totalBytes),
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to initiate resumable upload (${res.status}): ${body}`);
  }

  const sessionUri = res.headers.get('Location');
  if (!sessionUri) {
    throw new Error('No Location header in resumable upload response');
  }

  return sessionUri;
}

// ---------------------------------------------------------------------------
// Chunk upload result
// ---------------------------------------------------------------------------

interface ChunkResult {
  done: boolean;
  bytesConfirmed: number;
  driveFileId?: string;
  md5Checksum?: string;
}

// ---------------------------------------------------------------------------
// Upload a single chunk
// ---------------------------------------------------------------------------

export async function uploadChunk(
  sessionUri: string,
  chunk: Uint8Array,
  start: number,
  end: number,
  total: number,
): Promise<ChunkResult> {
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      'Content-Length': String(chunk.byteLength),
      'Content-Range': `bytes ${start}-${end}/${total}`,
    },
    body: chunk.buffer as ArrayBuffer,
  });

  return await parseUploadResponse(res);
}

// ---------------------------------------------------------------------------
// Query upload progress (resume protocol)
// ---------------------------------------------------------------------------

export async function queryUploadProgress(
  sessionUri: string,
  totalBytes: number,
): Promise<ChunkResult> {
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      'Content-Length': '0',
      'Content-Range': `bytes */${totalBytes}`,
    },
  });

  if (res.status === 404) {
    throw new Error('Upload session expired');
  }

  return await parseUploadResponse(res);
}

// ---------------------------------------------------------------------------
// Shared response parser for upload endpoints
// ---------------------------------------------------------------------------

async function parseUploadResponse(res: Response): Promise<ChunkResult> {
  // 200 or 201 = upload complete
  if (res.status === 200 || res.status === 201) {
    const data = await res.json();
    return {
      done: true,
      bytesConfirmed: -1, // Not applicable when done
      driveFileId: data.id,
      md5Checksum: data.md5Checksum,
    };
  }

  // 308 = resume incomplete (normal in-progress response)
  if (res.status === 308) {
    const rangeHeader = res.headers.get('Range');
    let bytesConfirmed = 0;

    if (rangeHeader) {
      // Format: "bytes=0-12345"
      const match = rangeHeader.match(/bytes=0-(\d+)/);
      if (match) {
        bytesConfirmed = Number(match[1]) + 1; // Range is inclusive, so +1
      }
    }

    return { done: false, bytesConfirmed };
  }

  // Any other status is an error
  const body = await res.text().catch(() => '');
  throw new Error(`Unexpected upload response ${res.status}: ${body}`);
}

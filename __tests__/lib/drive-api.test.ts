import {
  listFolders,
  createFolder,
  findFile,
  initiateResumableUpload,
  uploadChunk,
  queryUploadProgress,
} from '@/lib/drive-api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOKEN = 'test-access-token';
const BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

interface MockResponseInit {
  status?: number;
  ok?: boolean;
  headers?: Record<string, string>;
  json?: unknown;
  text?: string;
}

function mockResponse(init: MockResponseInit = {}): Response {
  const {
    status = 200,
    ok = status >= 200 && status < 300,
    headers = {},
    json,
    text = '',
  } = init;

  return {
    ok,
    status,
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
    json: jest.fn().mockResolvedValue(json),
    text: jest.fn().mockResolvedValue(text),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// listFolders
// ---------------------------------------------------------------------------

describe('listFolders', () => {
  it('returns an array of folders', async () => {
    const folders = [
      { id: 'folder-1', name: 'Backups' },
      { id: 'folder-2', name: 'Photos' },
    ];
    fetchMock.mockResolvedValue(
      mockResponse({ json: { files: folders } }),
    );

    const result = await listFolders('parent-id', TOKEN);

    expect(result).toEqual(folders);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(`${BASE}/files?`);
    expect(url).toContain('orderBy=name');

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.headers).toEqual(
      expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
    );
  });

  it('returns an empty array when API returns no files key', async () => {
    fetchMock.mockResolvedValue(mockResponse({ json: {} }));

    const result = await listFolders('parent-id', TOKEN);

    expect(result).toEqual([]);
  });

  it('escapes single quotes in parentId', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ json: { files: [] } }),
    );

    await listFolders("parent'id", TOKEN);

    const url = fetchMock.mock.calls[0][0] as string;
    const decodedUrl = decodeURIComponent(url);
    expect(decodedUrl).toContain("parent\\'id");
    expect(decodedUrl).not.toContain("parent'id' in parents");
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: 403, ok: false, text: 'Forbidden' }),
    );

    await expect(listFolders('parent-id', TOKEN)).rejects.toThrow(
      'Drive API error 403: Forbidden',
    );
  });
});

// ---------------------------------------------------------------------------
// createFolder
// ---------------------------------------------------------------------------

describe('createFolder', () => {
  it('sends POST with correct body and returns folder object', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ json: { id: 'new-folder-id', name: 'New Folder' } }),
    );

    const result = await createFolder('New Folder', 'parent-id', TOKEN);

    expect(result).toEqual({ id: 'new-folder-id', name: 'New Folder' });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      name: 'New Folder',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['parent-id'],
    });
  });

  it('includes Authorization and Content-Type headers', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ json: { id: 'id', name: 'n' } }),
    );

    await createFolder('Folder', 'parent', TOKEN);

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe(`Bearer ${TOKEN}`);
  });
});

// ---------------------------------------------------------------------------
// findFile
// ---------------------------------------------------------------------------

describe('findFile', () => {
  it('returns file with id and size when found', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        json: { files: [{ id: 'file-1', size: '1048576' }] },
      }),
    );

    const result = await findFile('backup.backup', 'folder-id', TOKEN);

    expect(result).toEqual({ id: 'file-1', size: 1048576 });
  });

  it('returns null when no files are returned', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ json: { files: [] } }),
    );

    const result = await findFile('backup.backup', 'folder-id', TOKEN);

    expect(result).toBeNull();
  });

  it('returns null when files key is undefined', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ json: {} }),
    );

    const result = await findFile('backup.backup', 'folder-id', TOKEN);

    expect(result).toBeNull();
  });

  it('escapes single quotes in fileName and folderId', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ json: { files: [] } }),
    );

    await findFile("file'name.backup", "folder'id", TOKEN);

    const url = fetchMock.mock.calls[0][0] as string;
    const decodedUrl = decodeURIComponent(url);
    expect(decodedUrl).toContain("file\\'name.backup");
    expect(decodedUrl).toContain("folder\\'id");
  });

  it('handles missing size field by defaulting to 0', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        json: { files: [{ id: 'file-1' }] },
      }),
    );

    const result = await findFile('backup.backup', 'folder-id', TOKEN);

    expect(result).toEqual({ id: 'file-1', size: 0 });
  });
});

// ---------------------------------------------------------------------------
// initiateResumableUpload
// ---------------------------------------------------------------------------

describe('initiateResumableUpload', () => {
  const sessionUri = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc123';

  it('returns session URI from Location header', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        status: 200,
        headers: { Location: sessionUri },
        json: {},
      }),
    );

    const result = await initiateResumableUpload('backup.backup', 'folder-id', 1024, TOKEN);

    expect(result).toBe(sessionUri);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe(`${UPLOAD_BASE}/files?uploadType=resumable`);

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');

    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${TOKEN}`);
    expect(headers['X-Upload-Content-Type']).toBe('application/octet-stream');
    expect(headers['X-Upload-Content-Length']).toBe('1024');

    const body = JSON.parse(options.body as string);
    expect(body).toEqual({ name: 'backup.backup', parents: ['folder-id'] });
  });

  it('throws when no Location header is present', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: 200, headers: {}, json: {} }),
    );

    await expect(
      initiateResumableUpload('backup.backup', 'folder-id', 1024, TOKEN),
    ).rejects.toThrow('No Location header in resumable upload response');
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: 500, ok: false, text: 'Internal Server Error' }),
    );

    await expect(
      initiateResumableUpload('backup.backup', 'folder-id', 1024, TOKEN),
    ).rejects.toThrow('Failed to initiate resumable upload (500): Internal Server Error');
  });
});

// ---------------------------------------------------------------------------
// uploadChunk
// ---------------------------------------------------------------------------

describe('uploadChunk', () => {
  const sessionUri = 'https://upload.example.com/session/abc';
  const chunk = new Uint8Array([1, 2, 3, 4]);

  it('handles status 200 as done', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        status: 200,
        json: { id: 'drive-file-id', md5Checksum: 'abc123' },
      }),
    );

    const result = await uploadChunk(sessionUri, chunk, 0, 3, 4);

    expect(result).toEqual({
      done: true,
      bytesConfirmed: -1,
      driveFileId: 'drive-file-id',
      md5Checksum: 'abc123',
    });
  });

  it('handles status 201 as done', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        status: 201,
        json: { id: 'drive-file-id', md5Checksum: 'def456' },
      }),
    );

    const result = await uploadChunk(sessionUri, chunk, 0, 3, 4);

    expect(result.done).toBe(true);
    expect(result.driveFileId).toBe('drive-file-id');
    expect(result.md5Checksum).toBe('def456');
  });

  it('handles status 308 with Range header', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        status: 308,
        ok: false,
        headers: { Range: 'bytes=0-524287' },
      }),
    );

    const result = await uploadChunk(sessionUri, chunk, 0, 3, 1048576);

    expect(result).toEqual({
      done: false,
      bytesConfirmed: 524288, // 524287 + 1
    });
  });

  it('handles status 308 without Range header', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: 308, ok: false, headers: {} }),
    );

    const result = await uploadChunk(sessionUri, chunk, 0, 3, 1048576);

    expect(result).toEqual({ done: false, bytesConfirmed: 0 });
  });

  it('sends correct Content-Range header', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        status: 308,
        ok: false,
        headers: { Range: 'bytes=0-99' },
      }),
    );

    await uploadChunk(sessionUri, chunk, 100, 199, 500);

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Range']).toBe('bytes 100-199/500');
    expect(headers['Content-Length']).toBe('4');
  });

  it('throws on unexpected status', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: 503, ok: false, text: 'Service Unavailable' }),
    );

    await expect(
      uploadChunk(sessionUri, chunk, 0, 3, 4),
    ).rejects.toThrow('Unexpected upload response 503: Service Unavailable');
  });
});

// ---------------------------------------------------------------------------
// queryUploadProgress
// ---------------------------------------------------------------------------

describe('queryUploadProgress', () => {
  const sessionUri = 'https://upload.example.com/session/abc';

  it('handles status 200 as done', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        status: 200,
        json: { id: 'file-id', md5Checksum: 'hash123' },
      }),
    );

    const result = await queryUploadProgress(sessionUri, 1024);

    expect(result).toEqual({
      done: true,
      bytesConfirmed: -1,
      driveFileId: 'file-id',
      md5Checksum: 'hash123',
    });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Length']).toBe('0');
    expect(headers['Content-Range']).toBe('bytes */1024');
  });

  it('handles status 308 as in progress', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        status: 308,
        ok: false,
        headers: { Range: 'bytes=0-511' },
      }),
    );

    const result = await queryUploadProgress(sessionUri, 1024);

    expect(result).toEqual({ done: false, bytesConfirmed: 512 });
  });

  it('throws on 404 (expired session)', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: 404, ok: false }),
    );

    await expect(
      queryUploadProgress(sessionUri, 1024),
    ).rejects.toThrow('Upload session expired');
  });

  it('throws on other error status', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ status: 400, ok: false, text: 'Bad Request' }),
    );

    await expect(
      queryUploadProgress(sessionUri, 1024),
    ).rejects.toThrow('Unexpected upload response 400: Bad Request');
  });
});

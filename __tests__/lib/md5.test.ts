// The manual mock at __mocks__/expo-file-system.js provides a File class with
// md5 = 'abc123def456' by default. jest-expo overrides expo-file-system, so we
// re-mock it in each test using jest.doMock + jest.resetModules.

function loadWithMd5(md5Value: string | null | undefined) {
  jest.resetModules();
  jest.doMock('expo-file-system', () => ({
    File: class MockFile {
      uri: string;
      md5 = md5Value;
      constructor(uri: string) {
        this.uri = uri;
      }
    },
    Directory: class {},
    Paths: { cache: 'mock://cache', document: 'mock://document' },
  }));
  return require('@/lib/md5') as typeof import('@/lib/md5');
}

describe('computeFileMd5', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('returns the MD5 hash for a valid file', () => {
    const { computeFileMd5 } = loadWithMd5('abc123def456');

    const result = computeFileMd5('file:///data/test-backup.bin');

    expect(result).toBe('abc123def456');
  });

  it('returns a different MD5 hash value', () => {
    const { computeFileMd5 } = loadWithMd5('deadbeef00000000');

    const result = computeFileMd5('file:///any/file.bin');

    expect(result).toBe('deadbeef00000000');
  });

  it('passes the file URI to the File constructor', () => {
    jest.resetModules();

    let capturedUri: string | undefined;
    jest.doMock('expo-file-system', () => ({
      File: class SpyFile {
        uri: string;
        md5 = 'hash';
        constructor(uri: string) {
          this.uri = uri;
          capturedUri = uri;
        }
      },
      Directory: class {},
      Paths: {},
    }));

    const { computeFileMd5 } = require('@/lib/md5');
    computeFileMd5('file:///data/specific-uri.bin');

    expect(capturedUri).toBe('file:///data/specific-uri.bin');
  });

  it('throws when md5 is null', () => {
    const { computeFileMd5 } = loadWithMd5(null);

    expect(() => computeFileMd5('file:///data/broken.bin')).toThrow(
      'Failed to compute MD5 for: file:///data/broken.bin',
    );
  });

  it('throws when md5 is undefined', () => {
    const { computeFileMd5 } = loadWithMd5(undefined);

    expect(() => computeFileMd5('file:///some/path')).toThrow(
      'Failed to compute MD5 for: file:///some/path',
    );
  });

  it('throws when md5 is an empty string (falsy)', () => {
    const { computeFileMd5 } = loadWithMd5('');

    expect(() => computeFileMd5('file:///empty-md5')).toThrow(
      'Failed to compute MD5 for: file:///empty-md5',
    );
  });

  it('includes the file URI in the error message', () => {
    const { computeFileMd5 } = loadWithMd5(null);

    expect(() => computeFileMd5('file:///custom/path/backup.db')).toThrow(
      'file:///custom/path/backup.db',
    );
  });
});

class MockFile {
  constructor(uri) {
    this.uri = uri;
    this.exists = true;
    this.size = 1024;
    this.md5 = 'abc123def456';
    this.modificationTime = Date.now();
    this._offset = 0;
  }

  get offset() {
    return this._offset;
  }

  set offset(val) {
    this._offset = val;
  }

  open() {
    return {
      offset: 0,
      readBytes: jest.fn((size) => new Uint8Array(size)),
      close: jest.fn(),
    };
  }

  copy() {}
  delete() {}
}

class MockDirectory {
  constructor(uri) {
    this.uri = uri;
  }

  list() {
    return [];
  }

  static pickDirectoryAsync() {
    return Promise.resolve({ uri: 'mock://picked-directory' });
  }
}

const Paths = {
  cache: 'mock://cache',
  document: 'mock://document',
};

module.exports = { File: MockFile, Directory: MockDirectory, Paths };

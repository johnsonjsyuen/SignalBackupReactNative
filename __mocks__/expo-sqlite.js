const rows = [];

const mockDb = {
  execSync: jest.fn(),
  runSync: jest.fn((sql, params) => {
    rows.push({ sql, params });
  }),
  getAllSync: jest.fn(() => [...rows]),
  getFirstSync: jest.fn(() => rows[0] ?? null),
  __getRows: () => rows,
  __resetRows: () => {
    rows.length = 0;
  },
};

module.exports = {
  openDatabaseSync: jest.fn(() => mockDb),
  __mockDb: mockDb,
};

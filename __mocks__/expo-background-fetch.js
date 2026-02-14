module.exports = {
  registerTaskAsync: jest.fn(() => Promise.resolve()),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
  getStatusAsync: jest.fn(() => Promise.resolve(3)), // BackgroundFetchStatus.Available = 3
  BackgroundFetchResult: {
    NewData: 1,
    NoData: 2,
    Failed: 3,
  },
  BackgroundFetchStatus: {
    Denied: 1,
    Restricted: 2,
    Available: 3,
  },
};

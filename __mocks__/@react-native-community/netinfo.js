const NetInfo = {
  fetch: jest.fn(() =>
    Promise.resolve({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
};

module.exports = NetInfo;
module.exports.default = NetInfo;

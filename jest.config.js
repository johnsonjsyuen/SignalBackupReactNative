module.exports = {
  preset: 'jest-expo',
  testEnvironment: './jest-env.js',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transform: {
    // Extend the default babel-jest transform with a plugin that converts
    // dynamic import() to require() so tests work in jest 30 without
    // --experimental-vm-modules.
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
        configFile: require.resolve('expo/internal/babel-preset'),
        plugins: ['./jest-babel-dynamic-import.js'],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@react-native-async-storage/async-storage|@react-native-community/netinfo|@react-native-google-signin/google-signin)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'hooks/**/*.ts',
    'providers/**/*.tsx',
    '!**/*.d.ts',
  ],
};

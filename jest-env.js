// Custom test environment that pre-defines globals as non-configurable
// properties. This prevents expo/src/winter/installGlobal.ts from overriding
// them with lazy getters that call require() during jest 30's setup phase,
// which would throw a ReferenceError.

const ReactNativeEnv = require('react-native/jest/react-native-env.js');

const EXPO_GLOBALS = [
  '__ExpoImportMetaRegistry',
  'structuredClone',
  'TextDecoder',
  'TextDecoderStream',
  'TextEncoderStream',
  'URL',
  'URLSearchParams',
];

module.exports = class CustomEnv extends ReactNativeEnv {
  constructor(config, context) {
    super(config, context);
    for (const name of EXPO_GLOBALS) {
      const existing = this.global[name];
      Object.defineProperty(this.global, name, {
        value: existing ?? {},
        configurable: false,
        enumerable: true,
        writable: true,
      });
    }
  }

  async setup() {
    // Suppress "Failed to set polyfill" warnings from expo's installGlobal.ts
    // that fire during jest-expo setup (before setupFilesAfterEnv runs).
    const origError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Failed to set polyfill')) return;
      origError.apply(console, args);
    };
    await super.setup();
    console.error = origError;
  }
};

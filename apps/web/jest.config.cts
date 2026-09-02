const nxPreset = require('@nx/jest/preset').default;

/** ESM packages under pnpm that Jest must transpile (sanitize-html 2.17.7 → htmlparser2 12). */
const JEST_ESM_PKGS =
  'marked|htmlparser2|entities|domhandler|domutils|domelementtype|dom-serializer';

module.exports = {
  ...nxPreset,
  displayName: 'web',
  testEnvironment: 'node',
  moduleNameMapper: {
    ...(nxPreset.moduleNameMapper ?? {}),
    '^hive-auth-wrapper$': '<rootDir>/src/test-mocks/hive-auth-wrapper.ts',
    '^@opden-data-layer/notifications-messages/testing$':
      '<rootDir>/../../libs/notifications-messages/src/testing/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/web',
  moduleFileExtensions: [...nxPreset.moduleFileExtensions, 'tsx', 'jsx'],
  transformIgnorePatterns: [
    `/node_modules/(?!(\\.pnpm/(?:${JEST_ESM_PKGS})@[^/]+/node_modules/(?:${JEST_ESM_PKGS})|(?:${JEST_ESM_PKGS}))/)`,
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mts|mjs|cts|cjs|html)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
};

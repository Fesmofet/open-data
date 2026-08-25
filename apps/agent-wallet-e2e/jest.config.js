module.exports = {
  displayName: 'agent-wallet-e2e',
  preset: '../../jest.preset.js',
  testTimeout: 15_000,
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@opden-data-layer/hive-auth$': '<rootDir>/../../libs/hive-auth/src/index.ts',
    '^@opden-data-layer/hive-broadcast$':
      '<rootDir>/../../libs/hive-broadcast/src/index.ts',
  },
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/agent-wallet-e2e',
};

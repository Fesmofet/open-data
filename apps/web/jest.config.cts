const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  displayName: 'web',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/web',
  moduleFileExtensions: [...nxPreset.moduleFileExtensions, 'tsx', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mts|mjs|cts|cjs|html)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
};

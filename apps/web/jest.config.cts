const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  displayName: 'web',
  testEnvironment: 'node',
  moduleNameMapper: {
    ...(nxPreset.moduleNameMapper ?? {}),
    '^marked$': '<rootDir>/src/test-mocks/marked.ts',
  },
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

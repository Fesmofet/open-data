module.exports = {
  displayName: 'migrate-mongo-waiv-airdrops',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: '<rootDir>/../../../tsconfig.base.json' },
    ],
  },
};

module.exports = {
  displayName: 'migrate-mongo-objects',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: '<rootDir>/../../../tsconfig.base.json' },
    ],
  },
};

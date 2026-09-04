/** ESM packages under pnpm that Jest must transpile (stream-json 3.x). */
const JEST_ESM_PKGS = 'stream-json|stream-chain';

module.exports = {
  displayName: 'chain-indexer',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    `/node_modules/(?!(\\.pnpm/(?:${JEST_ESM_PKGS})@[^/]+/node_modules/(?:${JEST_ESM_PKGS})|(?:${JEST_ESM_PKGS}))/)`,
  ],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '^.+\\.m?js$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/chain-indexer',
};

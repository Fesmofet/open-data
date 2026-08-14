const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const {
  nestOptionalIgnorePlugins,
  nestIgnoreWarnings,
} = require('../nest-webpack.shared.js');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  ignoreWarnings: nestIgnoreWarnings,
  output: {
    path: join(__dirname, '../../dist/apps/agent-wallet'),
    clean: true,
    ...(!isProd && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    ...nestOptionalIgnorePlugins(),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: isProd,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: !isProd,
      externalDependencies: ['@hiveio/dhive', 'secp256k1'],
    }),
  ],
};

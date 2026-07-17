'use strict';

const webpack = require('webpack');

/**
 * Nest resolves these packages dynamically; webpack must not try to bundle them.
 * Runtime: Nest catches MODULE_NOT_FOUND when the feature is unused.
 */
const NEST_OPTIONAL_MODULES = [
  '@nestjs/microservices',
  '@nestjs/microservices/microservices-module',
  '@nestjs/platform-socket.io',
  'class-validator',
  'class-transformer',
  'class-transformer/storage',
  'cache-manager',
  '@nestjs/platform-fastify',
  'fastify-swagger',
  'fastify-static',
  'fastify-view',
  'hbs',
  'file-type',
  'bufferutil',
  'utf-8-validate',
];

function nestOptionalIgnorePlugins() {
  return [
    new webpack.IgnorePlugin({
      checkResource(resource) {
        return NEST_OPTIONAL_MODULES.some(
          (mod) => resource === mod || resource.startsWith(`${mod}/`),
        );
      },
    }),
  ];
}

/**
 * Suppress known webpack noise from Nest/Express/Kysely/load-esm dynamic requires
 * and vendor packages that ship broken source maps (MCP SDK, iterare).
 * Scoped to node_modules so first-party dynamic requires still warn.
 */
const nestIgnoreWarnings = [
  {
    module: /node_modules/,
    message: /Critical dependency: the request of a dependency is an expression/,
  },
  /Failed to parse source map/,
];

module.exports = { nestOptionalIgnorePlugins, nestIgnoreWarnings };

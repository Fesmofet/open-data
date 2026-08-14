'use strict';

/**
 * Ensures dist/apps/<app>/main.js is a standalone bundle with no external npm
 * require()/import() — only Node builtins are allowed.
 *
 * Usage (after nx build):
 *   node scripts/check-standalone-bundle.cjs --app agent-wallet
 */

const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const ROOT = path.resolve(__dirname, '..');

const STANDALONE_APPS: string[] = [];

const NODE_BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);

function npmPackageName(spec) {
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.slice(0, 2).join('/');
  }
  return spec.split('/')[0];
}

function addRuntimePackage(packages, spec) {
  if (spec.startsWith('node:')) {
    const bare = spec.slice('node:'.length);
    if (NODE_BUILTINS.has(spec) || NODE_BUILTINS.has(bare)) {
      return;
    }
  }
  if (NODE_BUILTINS.has(spec)) {
    return;
  }
  if (spec === 'crypto') {
    return;
  }
  packages.add(npmPackageName(spec));
}

function stripStringLiterals(code) {
  return code
    .replace(/'(?:\\.|[^'\\])*'/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '""');
}

function extractExternalPackages(mainJsPath) {
  const content = stripStringLiterals(fs.readFileSync(mainJsPath, 'utf8'));
  const packages = new Set();
  for (const re of [/require\("([^"]+)"\)/g, /import\("([^"]+)"\)/g]) {
    let m;
    while ((m = re.exec(content))) {
      addRuntimePackage(packages, m[1]);
    }
  }
  return packages;
}

function checkApp(app) {
  const mainJs = path.join(ROOT, 'dist', 'apps', app, 'main.js');
  if (!fs.existsSync(mainJs)) {
    console.error(`check-standalone-bundle: missing ${mainJs} — run nx build first`);
    return false;
  }

  const required = extractExternalPackages(mainJs);
  if (required.size === 0) {
    return true;
  }

  console.error(
    `check-standalone-bundle: "${app}" bundle requires external packages: ${[...required].sort().join(', ')}`,
  );
  console.error(
    'Standalone bundles must inline all dependencies — configure webpack externalDependencies or bundle the package.',
  );
  return false;
}

function main() {
  const argv = process.argv.slice(2);
  let apps = [...STANDALONE_APPS];
  const appIdx = argv.indexOf('--app');
  if (appIdx !== -1 && argv[appIdx + 1]) {
    apps = [argv[appIdx + 1]];
  }

  let allOk = true;
  for (const app of apps) {
    if (!STANDALONE_APPS.includes(app)) {
      console.warn(`check-standalone-bundle: skip unknown app "${app}"`);
      continue;
    }
    if (!checkApp(app)) {
      allOk = false;
    }
  }

  if (!allOk) {
    process.exit(1);
  }
  console.log('check-standalone-bundle: OK');
}

main();

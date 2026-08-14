'use strict';

/**
 * Align dist/apps/<app>/package.json dependency specifiers with the pruned
 * pnpm-lock.yaml importers section, and drop workspace-only fields so
 * `pnpm install --prod --frozen-lockfile --ignore-workspace` works in CI smoke.
 *
 * Usage (after nx run <app>:prune-lockfile):
 *   node scripts/sync-pruned-package-lock.cjs --app agent-wallet
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function parseImporterSpecifiers(lockfileText) {
  const lines = lockfileText.split(/\r?\n/);
  const importersIdx = lines.findIndex((line) => line === 'importers:');
  if (importersIdx === -1) {
    throw new Error('sync-pruned-package-lock: missing importers section');
  }

  const packagesIdx = lines.findIndex(
    (line, idx) => idx > importersIdx && line === 'packages:',
  );
  const importerLines =
    packagesIdx === -1 ? lines.slice(importersIdx + 1) : lines.slice(importersIdx + 1, packagesIdx);

  const specifiers = new Map();
  let currentDep = null;
  let inRootImporter = false;
  let inDependencies = false;

  for (const line of importerLines) {
    if (line === '  .:') {
      inRootImporter = true;
      inDependencies = false;
      currentDep = null;
      continue;
    }
    if (!inRootImporter) {
      continue;
    }
    if (/^  [^ ]/.test(line) && line !== '  .:' && !line.startsWith('    ')) {
      break;
    }
    if (line === '    dependencies:') {
      inDependencies = true;
      continue;
    }
    if (!inDependencies) {
      continue;
    }
    const depMatch = line.match(/^      '([^']+)':$/);
    if (depMatch) {
      currentDep = depMatch[1];
      continue;
    }
    const depMatchBare = line.match(/^      ([^'":\s][^:]*):$/);
    if (depMatchBare) {
      currentDep = depMatchBare[1];
      continue;
    }
    const specMatch = line.match(/^        specifier: (.+)$/);
    if (specMatch && currentDep) {
      specifiers.set(currentDep, specMatch[1].trim());
      currentDep = null;
    }
  }

  return specifiers;
}

function stripLockfileOverrides(lockfileText) {
  const lines = lockfileText.split(/\r?\n/);
  const overridesIdx = lines.findIndex((line) => line === 'overrides:');
  if (overridesIdx === -1) {
    return lockfileText;
  }
  const importersIdx = lines.findIndex(
    (line, idx) => idx > overridesIdx && line === 'importers:',
  );
  if (importersIdx === -1) {
    throw new Error('sync-pruned-package-lock: missing importers after overrides');
  }
  return [...lines.slice(0, overridesIdx), ...lines.slice(importersIdx)].join('\n');
}

function syncApp(app) {
  const distDir = path.join(ROOT, 'dist', 'apps', app);
  const pkgPath = path.join(distDir, 'package.json');
  const lockPath = path.join(distDir, 'pnpm-lock.yaml');

  if (!fs.existsSync(pkgPath) || !fs.existsSync(lockPath)) {
    console.error(
      `sync-pruned-package-lock: missing ${pkgPath} or ${lockPath} — run nx build + prune-lockfile first`,
    );
    return false;
  }

  const lockfileText = fs.readFileSync(lockPath, 'utf8');
  const specifiers = parseImporterSpecifiers(lockfileText);
  if (specifiers.size === 0) {
    console.error('sync-pruned-package-lock: no importer dependencies found in lockfile');
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const nextDeps = {};
  for (const [name, specifier] of specifiers) {
    nextDeps[name] = specifier;
  }
  pkg.dependencies = nextDeps;
  delete pkg.pnpm;
  delete pkg.packageManager;

  const strippedLockfile = stripLockfileOverrides(lockfileText);
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  fs.writeFileSync(lockPath, strippedLockfile.endsWith('\n') ? strippedLockfile : `${strippedLockfile}\n`);

  console.log(`sync-pruned-package-lock: synced ${app} (${specifiers.size} dependencies)`);
  return true;
}

function main() {
  const argv = process.argv.slice(2);
  const appIdx = argv.indexOf('--app');
  if (appIdx === -1 || !argv[appIdx + 1]) {
    console.error('Usage: node scripts/sync-pruned-package-lock.cjs --app <app>');
    process.exit(1);
  }
  if (!syncApp(argv[appIdx + 1])) {
    process.exit(1);
  }
}

main();

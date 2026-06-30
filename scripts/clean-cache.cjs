'use strict';

/**
 * Clear local Nx task cache and Next.js build/dev caches.
 *
 * Usage (repo root):
 *   pnpm clean:cache
 *   node scripts/clean-cache.cjs
 *   node scripts/clean-cache.cjs --nx-only
 *   node scripts/clean-cache.cjs --next-only
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/** Avoid Nx TUI race when nx is spawned from this script (Windows / VS Code terminal). */
const SUBPROCESS_ENV = {
  ...process.env,
  NX_TUI: 'false',
};

const NEXT_CACHE_DIRS = [
  path.join(ROOT, 'apps/web/.next'),
  path.join(ROOT, 'dist/apps/web/.next'),
];

function parseArgs(argv) {
  const nxOnly = argv.includes('--nx-only');
  const nextOnly = argv.includes('--next-only');
  if (nxOnly && nextOnly) {
    console.error('Use at most one of --nx-only or --next-only.');
    process.exit(1);
  }
  return {
    cleanNx: !nextOnly,
    cleanNext: !nxOnly,
  };
}

function rmDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }
  fs.rmSync(dirPath, { recursive: true, force: true });
  return true;
}

function cleanNxCache() {
  console.log('Resetting Nx cache and daemon workspace data…');
  const result = spawnSync('pnpm exec nx reset', {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: SUBPROCESS_ENV,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function cleanNextCache() {
  let removed = 0;
  for (const dir of NEXT_CACHE_DIRS) {
    if (rmDir(dir)) {
      console.log(`Removed ${path.relative(ROOT, dir)}`);
      removed += 1;
    }
  }
  if (removed === 0) {
    console.log('No Next.js cache directories found.');
  }
}

function main() {
  const { cleanNx, cleanNext } = parseArgs(process.argv.slice(2));

  if (cleanNx) {
    cleanNxCache();
  }
  if (cleanNext) {
    cleanNextCache();
  }

  console.log('Cache cleanup complete.');
}

main();

'use strict';

/**
 * Local guard before pushing web Docker images: runs the same Next production
 * build as `apps/web/Dockerfile` builder stage (`pnpm exec next build ./apps/web`).
 *
 * Usage (repo root):
 *   pnpm verify:web-production-build
 *   pnpm nx run web:verify-production-build
 */

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run() {
  console.log(
    'Verifying web production build (Next compile + TypeScript — matches Docker builder)…',
  );

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
  };

  const result = spawnSync('pnpm exec next build ./apps/web', {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log('Web production build OK.');
}

run();

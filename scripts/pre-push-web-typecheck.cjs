'use strict';

/**
 * Git pre-push hook (via husky): run web TypeScript check when pushed commits
 * touch apps/web or workspace libs imported by the web app.
 *
 * Wired from .husky/pre-push — bypass with git push --no-verify (CI still enforces).
 */

const { spawnSync, execFileSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ZERO_SHA = '0000000000000000000000000000000000000000';
const WEB_PATH_PREFIXES = ['apps/web/', 'libs/'];

function gitOutput(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function changedFilesForPush(localSha, remoteSha) {
  if (remoteSha === ZERO_SHA) {
    return gitOutput(['diff', '--name-only', '--root', localSha]);
  }
  return gitOutput(['diff', '--name-only', remoteSha, localSha]);
}

function touchesWebScope(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return WEB_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function shouldTypecheck(stdin) {
  const lines = stdin.trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    return false;
  }

  for (const line of lines) {
    const [, localSha, , remoteSha] = line.split(/\s+/);
    if (!localSha || localSha === ZERO_SHA) {
      continue;
    }

    const files = changedFilesForPush(localSha, remoteSha || ZERO_SHA);
    if (!files) {
      continue;
    }

    for (const filePath of files.split('\n')) {
      if (filePath && touchesWebScope(filePath)) {
        return true;
      }
    }
  }

  return false;
}

function runTypecheck() {
  console.log(
    'pre-push: apps/web or libs changed — running pnpm typecheck:web…',
  );

  const result = spawnSync('pnpm', ['typecheck:web'], {
    cwd: ROOT,
    env: process.env,
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
}

function main() {
  const stdin = readFileSync(0, 'utf8');
  if (!shouldTypecheck(stdin)) {
    return;
  }
  runTypecheck();
}

main();

import { readdir, readFile } from 'node:fs/promises';
import * as path from 'node:path';

const ROOT = path.resolve(process.cwd());

const FORBIDDEN_IN_CORE = [
  /@nestjs\//,
  /@hiveio\/dhive/,
  /from ['"]node:crypto['"]/,
  /from ['"]node:fs['"]/,
  /from ['"]pg['"]/,
  /from ['"]ioredis['"]/,
];

const CORE_SUBPATH_ONLY = new Set([
  path.join(ROOT, 'libs/core/src/utils/hive-tx-signer.ts'),
  path.join(ROOT, 'libs/core/src/utils/osl-messaging-crypto.ts'),
]);

const SKIP_DIRS = new Set(['node_modules', 'dist', 'out-tsc', '.git', 'generated']);

const LEGACY_CORE_DB_IMPORT = /libs\/core\/src\/db/;

function fail(message: string): never {
  console.error(`check:core-imports: ${message}`);
  process.exit(1);
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(abs, out);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      out.push(abs);
    }
  }
  return out;
}

function rel(filePath: string): string {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

async function checkCoreBarrelPurity(): Promise<void> {
  const coreDir = path.join(ROOT, 'libs/core/src');
  const files = await walk(coreDir);

  for (const file of files) {
    if (file.endsWith('.spec.ts') || file.endsWith('.test.ts')) continue;
    if (CORE_SUBPATH_ONLY.has(path.normalize(path.resolve(file)))) continue;

    const source = await readFile(file, 'utf8');
    if (/from ['"]\.\.\/db['"]/.test(source) || /from ['"]\.\/db['"]/.test(source)) {
      fail(`${rel(file)}: import DB types from @opden-data-layer/odl-db-types, not ../db`);
    }
    for (const pattern of FORBIDDEN_IN_CORE) {
      if (pattern.test(source)) {
        fail(`${rel(file)}: forbidden import pattern ${pattern}`);
      }
    }
  }
}

async function checkCoreBarrelExports(): Promise<void> {
  const indexPath = path.join(ROOT, 'libs/core/src/index.ts');
  const source = await readFile(indexPath, 'utf8');
  if (source.includes("export * from './db'")) {
    fail('libs/core/src/index.ts must not re-export ./db (use @opden-data-layer/odl-db-types)');
  }
  if (source.includes('hive-tx-signer')) {
    fail('libs/core/src/index.ts must not export hive-tx-signer (use subpath)');
  }
}

async function checkUtilsBarrel(): Promise<void> {
  const utilsIndexPath = path.join(ROOT, 'libs/core/src/utils/index.ts');
  const source = await readFile(utilsIndexPath, 'utf8');
  if (source.includes("export * from './osl-messaging-crypto'")) {
    fail(
      'libs/core/src/utils/index.ts must not export osl-messaging-crypto (use subpath @opden-data-layer/core/utils/osl-messaging-crypto)',
    );
  }
}

async function checkScriptsImports(): Promise<void> {
  const scriptsDir = path.join(ROOT, 'scripts');
  const files = await walk(scriptsDir);

  for (const file of files) {
    if (file.endsWith('check-core-imports.ts')) continue;
    const source = await readFile(file, 'utf8');
    if (LEGACY_CORE_DB_IMPORT.test(source)) {
      fail(
        `${rel(file)}: use @opden-data-layer/odl-db-types instead of libs/core/src/db`,
      );
    }
  }
}

async function checkLegacyCoreDbPaths(): Promise<void> {
  const dirs = [
    path.join(ROOT, 'apps'),
    path.join(ROOT, 'libs'),
    path.join(ROOT, 'scripts'),
  ];

  for (const dir of dirs) {
    const files = await walk(dir);
    for (const file of files) {
      if (file.endsWith('check-core-imports.ts')) continue;
      const source = await readFile(file, 'utf8');
      if (LEGACY_CORE_DB_IMPORT.test(source)) {
        fail(
          `${rel(file)}: use @opden-data-layer/odl-db-types instead of libs/core/src/db`,
        );
      }
    }
  }
}

async function checkDeprecatedCoreDbAlias(): Promise<void> {
  const dirs = [path.join(ROOT, 'apps'), path.join(ROOT, 'libs'), path.join(ROOT, 'scripts')];
  const pattern = /@opden-data-layer\/core\/db/;

  for (const dir of dirs) {
    const files = await walk(dir);
    for (const file of files) {
      if (file.endsWith('check-core-imports.ts')) continue;
      const source = await readFile(file, 'utf8');
      if (pattern.test(source)) {
        fail(
          `${rel(file)}: @opden-data-layer/core/db was removed — use @opden-data-layer/odl-db-types`,
        );
      }
    }
  }
}

async function checkInlineCoreOdlDatabaseJSDoc(): Promise<void> {
  const dirs = [path.join(ROOT, 'apps'), path.join(ROOT, 'libs')];
  const pattern = /import\s*\(\s*['"]@opden-data-layer\/core['"]\s*\)\s*\.\s*OdlDatabase/;

  for (const dir of dirs) {
    const files = await walk(dir);
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      if (pattern.test(source)) {
        fail(
          `${rel(file)}: JSDoc must reference @opden-data-layer/odl-db-types.OdlDatabase, not core`,
        );
      }
    }
  }
}

async function isUseClientFile(source: string): Promise<boolean> {
  return /^['"]use client['"];?\s*$/m.test(source.split('\n').slice(0, 5).join('\n'));
}

function isTypeOnlyCoreImport(line: string): boolean {
  return /import\s+type\s+\{/.test(line);
}

async function checkWebImports(): Promise<void> {
  const webSrc = path.join(ROOT, 'apps/web/src');
  const files = await walk(webSrc);

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const isClient = await isUseClientFile(source);

    if (isClient && source.includes('@opden-data-layer/odl-db-types')) {
      const hasRuntimeImport = /import\s+(?!type)[^;]*@opden-data-layer\/odl-db-types/.test(
        source,
      );
      if (hasRuntimeImport) {
        fail(
          `${rel(file)}: client component must use import type from @opden-data-layer/odl-db-types`,
        );
      }
    }

    if (isClient && source.includes("from '@opden-data-layer/core'")) {
      const lines = source.split('\n');
      for (const line of lines) {
        if (line.includes("from '@opden-data-layer/core'") && !isTypeOnlyCoreImport(line)) {
          fail(
            `${rel(file)}: client component must not import @opden-data-layer/core barrel (use subpaths)`,
          );
        }
      }
    }
  }
}

async function checkMessagingHelperDuplicate(): Promise<void> {
  const helperPath = path.join(
    ROOT,
    'apps/web/src/modules/messaging/domain/messaging.helpers.ts',
  );
  const source = await readFile(helperPath, 'utf8');
  if (/export function buildObjectChannelId/.test(source)) {
    fail(
      'messaging.helpers.ts must import buildObjectChannelId from @opden-data-layer/core/utils/osl-messaging',
    );
  }
  if (!source.includes('@opden-data-layer/core/utils/osl-messaging')) {
    fail('messaging.helpers.ts must import from @opden-data-layer/core/utils/osl-messaging');
  }
}

async function main(): Promise<void> {
  await checkCoreBarrelPurity();
  await checkCoreBarrelExports();
  await checkUtilsBarrel();
  await checkScriptsImports();
  await checkLegacyCoreDbPaths();
  await checkDeprecatedCoreDbAlias();
  await checkInlineCoreOdlDatabaseJSDoc();
  await checkWebImports();
  await checkMessagingHelperDuplicate();
  console.log('check:core-imports: OK');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

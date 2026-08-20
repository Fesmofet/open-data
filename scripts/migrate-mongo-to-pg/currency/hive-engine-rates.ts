/**
 * Stream Mongo `hive_engine_rates` JSON array export into `hive_engine_rates`.
 *
 * Usage:
 *   pnpm migrate:mongo-hive-engine-rates <path-to-hive_engine_rates.json> [--dry-run] [--skip-indexes]
 *   pnpm migrate:mongo-hive-engine-rates --recreate-indexes-only
 */
import { Writable } from 'node:stream';

import type { NewHiveEngineRatesRow, OdlDatabase } from '@opden-data-layer/odl-db-types';
import { resolveConnectionString } from '../../../libs/migrations/src/connection';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import {
  dropHiveEngineRatesBulkIndexes,
  recreateHiveEngineRatesBulkIndexes,
} from './bulk-indexes';
import {
  BATCH,
  fail,
  mongoEngineToRow,
  parseDryRun,
  parseRecreateIndexesOnly,
  parseSkipIndexes,
  requireFilePath,
  streamJsonArrayFile,
} from './shared';

function dailyKey(row: Omit<NewHiveEngineRatesRow, 'id'>): string {
  return `${row.base}:${row.date}`;
}

async function flushEngine(
  dbK: Kysely<OdlDatabase>,
  buf: Omit<NewHiveEngineRatesRow, 'id'>[],
  dryRun: boolean,
): Promise<void> {
  if (buf.length === 0 || dryRun) {
    return;
  }
  await dbK.insertInto('hive_engine_rates').values(buf).execute();
}

async function recreateIndexesOnly(): Promise<void> {
  const pool = new Pool({ connectionString: resolveConnectionString() });
  const dbK = new Kysely<OdlDatabase>({ dialect: new PostgresDialect({ pool }) });
  try {
    await recreateHiveEngineRatesBulkIndexes(dbK);
  } finally {
    await dbK.destroy();
  }
  console.log('hive_engine_rates indexes recreated.');
}

async function migrateFile(
  filePath: string,
  dryRun: boolean,
  skipIndexes: boolean,
): Promise<void> {
  const pool = new Pool({ connectionString: resolveConnectionString() });
  const dbK = new Kysely<OdlDatabase>({ dialect: new PostgresDialect({ pool }) });

  let seen = 0;
  let skipped = 0;
  let buffered = 0;
  let dailyDupSkipped = 0;
  let buf: Omit<NewHiveEngineRatesRow, 'id'>[] = [];
  const seenDaily = new Set<string>();

  if (skipIndexes) {
    await dropHiveEngineRatesBulkIndexes(dbK);
  }

  try {
    const sink = new Writable({
      objectMode: true,
      write(
        item: { key: number; value: unknown },
        _encoding: BufferEncoding,
        callback: (err?: Error | null) => void,
      ) {
        seen++;
        if (
          item.value !== null &&
          typeof item.value === 'object' &&
          !Array.isArray(item.value)
        ) {
          const row = mongoEngineToRow(item.value as Record<string, unknown>);
          if (row) {
            if (row.is_daily) {
              const key = dailyKey(row);
              if (seenDaily.has(key)) {
                dailyDupSkipped++;
              } else {
                seenDaily.add(key);
                buf.push(row);
                buffered++;
              }
            } else {
              buf.push(row);
              buffered++;
            }
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }

        const flushPromise =
          buf.length >= BATCH ?
            flushEngine(dbK, buf, dryRun).then(() => {
              buf = [];
            })
          : Promise.resolve();

        flushPromise
          .then(() => {
            if (seen % 10_000 === 0) {
              console.log(`  ... ${seen} array elements (${buffered} buffered)`);
            }
            callback();
          })
          .catch((err: unknown) =>
            callback(err instanceof Error ? err : new Error(String(err))),
          );
      },
    });

    await streamJsonArrayFile(filePath, sink);
    await flushEngine(dbK, buf, dryRun);
  } finally {
    if (skipIndexes) {
      await recreateHiveEngineRatesBulkIndexes(dbK);
    }
    await dbK.destroy();
  }

  console.log('hive_engine_rates migration stats:', {
    elementsSeen: seen,
    rowsBuffered: buffered,
    rowsSkipped: skipped,
    dailyDupSkipped,
    dryRun,
    skipIndexes,
  });

  if (buffered === 0) {
    fail('No rows were mapped from the input file — check export path and document shape.');
  }
}

const argv = process.argv.slice(2);

if (parseRecreateIndexesOnly(argv)) {
  void recreateIndexesOnly().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
} else {
  const filePath = requireFilePath(
    argv,
    'Usage: pnpm migrate:mongo-hive-engine-rates <path-to-hive_engine_rates.json> [--dry-run] [--skip-indexes]\n' +
      '       pnpm migrate:mongo-hive-engine-rates --recreate-indexes-only',
  );

  void migrateFile(filePath, parseDryRun(argv), parseSkipIndexes(argv)).catch(
    (err: unknown) => {
      console.error(err);
      process.exit(1);
    },
  );
}

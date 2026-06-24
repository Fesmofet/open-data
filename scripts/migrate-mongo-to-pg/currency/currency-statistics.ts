/**
 * Stream Mongo `currency_statistics` JSON array export into `currency_statistics`.
 *
 * Usage:
 *   pnpm migrate:mongo-currency-statistics <path-to-currency_statistics.json> [--dry-run] [--stats-daily-only] [--skip-indexes]
 */
import { Writable } from 'node:stream';

import type { NewCurrencyStatisticsRow, OdlDatabase } from '../../../libs/core/src/db';
import { resolveConnectionString } from '../../../libs/migrations/src/connection';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import {
  dropCurrencyStatisticsBulkIndexes,
  recreateCurrencyStatisticsBulkIndexes,
} from './bulk-indexes';
import {
  BATCH,
  fail,
  mongoStatToRow,
  parseDryRun,
  parseSkipIndexes,
  parseStatsDailyOnly,
  requireFilePath,
  streamJsonArrayFile,
} from './shared';

async function flushStats(
  dbK: Kysely<OdlDatabase>,
  buf: Omit<NewCurrencyStatisticsRow, 'id'>[],
  dryRun: boolean,
): Promise<void> {
  if (buf.length === 0 || dryRun) {
    return;
  }
  await dbK.insertInto('currency_statistics').values(buf).execute();
}

async function migrateFile(
  filePath: string,
  dryRun: boolean,
  statsDailyOnly: boolean,
  skipIndexes: boolean,
): Promise<void> {
  const pool = new Pool({ connectionString: resolveConnectionString() });
  const dbK = new Kysely<OdlDatabase>({ dialect: new PostgresDialect({ pool }) });

  let seen = 0;
  let skipped = 0;
  let buffered = 0;
  let buf: Omit<NewCurrencyStatisticsRow, 'id'>[] = [];

  if (skipIndexes) {
    await dropCurrencyStatisticsBulkIndexes(dbK);
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
          const row = mongoStatToRow(item.value as Record<string, unknown>);
          if (row && (!statsDailyOnly || row.is_daily)) {
            buf.push(row);
            buffered++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }

        const flushPromise =
          buf.length >= BATCH ?
            flushStats(dbK, buf, dryRun).then(() => {
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
    await flushStats(dbK, buf, dryRun);
  } finally {
    if (skipIndexes) {
      await recreateCurrencyStatisticsBulkIndexes(dbK);
    }
    await dbK.destroy();
  }

  console.log('currency_statistics migration stats:', {
    elementsSeen: seen,
    rowsBuffered: buffered,
    rowsSkipped: skipped,
    dryRun,
    statsDailyOnly,
    skipIndexes,
  });

  if (buffered === 0) {
    fail('No rows were mapped from the input file — check export path and document shape.');
  }
}

const argv = process.argv.slice(2);
const filePath = requireFilePath(
  argv,
  'Usage: pnpm migrate:mongo-currency-statistics <path-to-currency_statistics.json> [--dry-run] [--stats-daily-only] [--skip-indexes]',
);

void migrateFile(
  filePath,
  parseDryRun(argv),
  parseStatsDailyOnly(argv),
  parseSkipIndexes(argv),
).catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  },
);

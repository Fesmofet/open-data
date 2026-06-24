/**
 * Stream Mongo `currency_rates` JSON array export into `currency_rates`.
 *
 * Usage:
 *   pnpm migrate:mongo-currency-rates <path-to-currency_rates.json> [--dry-run] [--skip-indexes]
 */
import { Writable } from 'node:stream';

import type { NewCurrencyRatesRow, OdlDatabase } from '../../../libs/core/src/db';
import { resolveConnectionString } from '../../../libs/migrations/src/connection';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import {
  dropCurrencyRatesBulkIndexes,
  recreateCurrencyRatesBulkIndexes,
} from './bulk-indexes';
import {
  BATCH,
  fail,
  mongoFiatToRow,
  parseDryRun,
  parseSkipIndexes,
  requireFilePath,
  streamJsonArrayFile,
} from './shared';

async function flushFiat(
  dbK: Kysely<OdlDatabase>,
  buf: Omit<NewCurrencyRatesRow, 'id'>[],
  dryRun: boolean,
  skipIndexes: boolean,
): Promise<void> {
  if (buf.length === 0 || dryRun) {
    return;
  }
  const chunk = buf;
  if (skipIndexes) {
    await dbK.insertInto('currency_rates').values(chunk).execute();
    return;
  }
  for (const row of chunk) {
    await dbK
      .insertInto('currency_rates')
      .values(row)
      .onConflict((oc) =>
        oc.columns(['base', 'date']).doUpdateSet({
          cad: row.cad,
          eur: row.eur,
          aud: row.aud,
          mxn: row.mxn,
          gbp: row.gbp,
          jpy: row.jpy,
          cny: row.cny,
          rub: row.rub,
          uah: row.uah,
          chf: row.chf,
        }),
      )
      .execute();
  }
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
  let buf: Omit<NewCurrencyRatesRow, 'id'>[] = [];

  if (skipIndexes) {
    await dropCurrencyRatesBulkIndexes(dbK);
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
          const row = mongoFiatToRow(item.value as Record<string, unknown>);
          if (row) {
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
            flushFiat(dbK, buf, dryRun, skipIndexes).then(() => {
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
    await flushFiat(dbK, buf, dryRun, skipIndexes);
  } finally {
    if (skipIndexes) {
      await recreateCurrencyRatesBulkIndexes(dbK);
    }
    await dbK.destroy();
  }

  console.log('currency_rates migration stats:', {
    elementsSeen: seen,
    rowsBuffered: buffered,
    rowsSkipped: skipped,
    dryRun,
    skipIndexes,
  });

  if (buffered === 0) {
    fail('No rows were mapped from the input file — check export path and document shape.');
  }
}

const argv = process.argv.slice(2);
const filePath = requireFilePath(
  argv,
  'Usage: pnpm migrate:mongo-currency-rates <path-to-currency_rates.json> [--dry-run] [--skip-indexes]',
);

void migrateFile(filePath, parseDryRun(argv), parseSkipIndexes(argv)).catch(
  (err: unknown) => {
    console.error(err);
    process.exit(1);
  },
);

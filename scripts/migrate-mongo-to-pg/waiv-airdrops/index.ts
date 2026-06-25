/**
 * Stream Mongo `EngineAccountHistory` JSON export (WAIV airdrop rows) into `hive_engine_waiv_airdrops`.
 *
 * Usage:
 *   pnpm migrate:mongo-hive-engine-waiv-airdrops <path-to-waiv_airdrops.json> [--dry-run] [--skip-indexes]
 *
 * Mongo export:
 *   mongoexport --collection=engineaccounthistories \
 *     --query='{"operation":"airdrops_newAirdrop","symbol":"WAIV"}' \
 *     --out=waiv_airdrops.json --jsonArray
 */
import { Writable } from 'node:stream';

import type { NewHiveEngineWaivAirdrop, OdlDatabase } from '../../../libs/core/src/db';
import { resolveConnectionString } from '../../../libs/migrations/src/connection';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

import {
  BATCH,
  fail,
  parseDryRun,
  parseSkipIndexes,
  requireFilePath,
  streamJsonArrayFile,
} from '../currency/shared';
import { mongoWaivAirdropToRow } from './map';
import type { MongoEngineAccountHistoryAirdrop } from './map';

async function dropAirdropBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Dropping hive_engine_waiv_airdrops indexes...');
  await sql`DROP INDEX IF EXISTS idx_hewa_account_ts_id`.execute(db);
}

async function recreateAirdropBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Recreating hive_engine_waiv_airdrops indexes...');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_hewa_account_ts_id
    ON hive_engine_waiv_airdrops (account, block_timestamp DESC, id DESC)
  `.execute(db);
}

async function flush(
  dbK: Kysely<OdlDatabase>,
  buf: Omit<NewHiveEngineWaivAirdrop, 'id' | 'created_at'>[],
  dryRun: boolean,
): Promise<void> {
  if (buf.length === 0 || dryRun) {
    return;
  }
  await dbK
    .insertInto('hive_engine_waiv_airdrops')
    .values(buf)
    .onConflict((oc) => oc.columns(['transaction_id', 'account']).doNothing())
    .execute();
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
  let buf: Omit<NewHiveEngineWaivAirdrop, 'id' | 'created_at'>[] = [];

  if (skipIndexes) {
    await dropAirdropBulkIndexes(dbK);
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
          const row = mongoWaivAirdropToRow(item.value as MongoEngineAccountHistoryAirdrop);
          if (row) {
            buf.push(row);
            buffered++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }

        if (buf.length >= BATCH) {
          flush(dbK, buf, dryRun)
            .then(() => {
              buf = [];
              callback();
            })
            .catch((e: Error) => callback(e));
          return;
        }
        callback();
      },
    });

    await streamJsonArrayFile(filePath, sink);
    await flush(dbK, buf, dryRun);

    if (skipIndexes && !dryRun) {
      await recreateAirdropBulkIndexes(dbK);
    }

    console.log(
      `hive_engine_waiv_airdrops import done: seen=${seen} buffered=${buffered} skipped=${skipped} dryRun=${dryRun}`,
    );
  } finally {
    await dbK.destroy();
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = parseDryRun(argv);
  const skipIndexes = parseSkipIndexes(argv);
  const filePath = requireFilePath(
    argv,
    'Usage: pnpm migrate:mongo-hive-engine-waiv-airdrops <path-to-waiv_airdrops.json> [--dry-run] [--skip-indexes]',
  );
  await migrateFile(filePath, dryRun, skipIndexes);
}

main().catch((e: Error) => fail(e.message));

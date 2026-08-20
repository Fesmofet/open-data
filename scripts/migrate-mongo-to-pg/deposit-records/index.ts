/**
 * Stream Mongo `EngineAccountHistory` JSON export (createDepositRecord rows) into `hive_engine_deposit_records`.
 *
 * Usage:
 *   pnpm migrate:mongo-hive-engine-deposit-records <path-to-engine_deposit_records.json> [--dry-run] [--skip-indexes]
 */
import { Writable } from 'node:stream';

import type { NewHiveEngineDepositRecord, OdlDatabase } from '@opden-data-layer/odl-db-types';
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
import { mongoDepositRecordToRow } from './map';
import type { MongoEngineAccountHistoryDeposit } from './map';

async function dropBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Dropping hive_engine_deposit_records indexes...');
  await sql`DROP INDEX IF EXISTS idx_hedr_account_ts_id`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_hedr_symbols_gin`.execute(db);
}

async function recreateBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Recreating hive_engine_deposit_records indexes...');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_hedr_account_ts_id
    ON hive_engine_deposit_records (account, block_timestamp DESC, id DESC)
  `.execute(db);
  await sql`
    CREATE INDEX IF NOT EXISTS idx_hedr_symbols_gin
    ON hive_engine_deposit_records USING GIN (symbols)
  `.execute(db);
}

async function flush(
  dbK: Kysely<OdlDatabase>,
  buf: Omit<NewHiveEngineDepositRecord, 'id' | 'created_at' | 'symbols'>[],
  dryRun: boolean,
): Promise<void> {
  if (buf.length === 0 || dryRun) {
    return;
  }
  await dbK
    .insertInto('hive_engine_deposit_records')
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
  let buf: Omit<NewHiveEngineDepositRecord, 'id' | 'created_at' | 'symbols'>[] = [];

  if (skipIndexes) {
    await dropBulkIndexes(dbK);
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
          const row = mongoDepositRecordToRow(
            item.value as MongoEngineAccountHistoryDeposit,
          );
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
      await recreateBulkIndexes(dbK);
    }

    console.log(
      `hive_engine_deposit_records import done: seen=${seen} buffered=${buffered} skipped=${skipped} dryRun=${dryRun}`,
    );
  } finally {
    await dbK.destroy();
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = parseDryRun(argv);
  const skipIndexes = parseSkipIndexes(argv);
  const filePath = requireFilePath(argv, 'migrate:mongo-hive-engine-deposit-records');
  await migrateFile(filePath, dryRun, skipIndexes);
}

main().catch((e: unknown) => fail(e));

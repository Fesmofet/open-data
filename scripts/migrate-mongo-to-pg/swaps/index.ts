/**
 * Stream Mongo `EngineAccountHistory` JSON export (swap rows only) into `hive_engine_swaps`.
 *
 * Usage:
 *   pnpm migrate:mongo-hive-engine-swaps <path-to-engine_swaps.json> [--dry-run] [--skip-indexes]
 *
 * Mongo export:
 *   mongoexport --collection=engineaccounthistories \
 *     --query='{"operation":"marketpools_swapTokens"}' \
 *     --out=engine_swaps.json --jsonArray
 */
import { Writable } from 'node:stream';

import type { NewHiveEngineSwap, OdlDatabase } from '../../../libs/core/src/db';
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
import type { MongoEngineAccountHistorySwap } from './types';

const SWAP_OPERATION = 'marketpools_swapTokens';

function str(value: unknown): string {
  return String(value ?? '').trim();
}

function num(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function mongoSwapToRow(
  doc: MongoEngineAccountHistorySwap,
): Omit<NewHiveEngineSwap, 'id' | 'symbols' | 'created_at'> | null {
  if (doc.operation && doc.operation !== SWAP_OPERATION) {
    return null;
  }

  const account = str(doc.account);
  const transactionId = str(doc.transactionId);
  const blockNumber = num(doc.blockNumber);
  const refHiveBlockNumber = num(doc.refHiveBlockNumber);
  const timestampUnix = num(doc.timestamp);
  const symbolOut = str(doc.symbolOut);
  const symbolIn = str(doc.symbolIn);
  const symbolOutQuantity = str(doc.symbolOutQuantity);
  const symbolInQuantity = str(doc.symbolInQuantity);

  if (
    !account ||
    !transactionId ||
    blockNumber === null ||
    refHiveBlockNumber === null ||
    timestampUnix === null ||
    !symbolOut ||
    !symbolIn ||
    !symbolOutQuantity ||
    !symbolInQuantity
  ) {
    return null;
  }

  return {
    account,
    transaction_id: transactionId,
    block_number: blockNumber,
    ref_hive_block_number: refHiveBlockNumber,
    block_timestamp: new Date(timestampUnix * 1000),
    symbol_out: symbolOut,
    symbol_in: symbolIn,
    symbol_out_quantity: symbolOutQuantity,
    symbol_in_quantity: symbolInQuantity,
  };
}

async function dropSwapBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Dropping hive_engine_swaps indexes...');
  await sql`DROP INDEX IF EXISTS idx_hes_symbols_gin`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_hes_account_ts_id`.execute(db);
}

async function recreateSwapBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Recreating hive_engine_swaps indexes...');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_hes_account_ts_id
    ON hive_engine_swaps (account, block_timestamp DESC, id DESC)
  `.execute(db);
  await sql`
    CREATE INDEX IF NOT EXISTS idx_hes_symbols_gin
    ON hive_engine_swaps USING GIN (symbols)
  `.execute(db);
}

async function flush(
  dbK: Kysely<OdlDatabase>,
  buf: Omit<NewHiveEngineSwap, 'id' | 'symbols' | 'created_at'>[],
  dryRun: boolean,
): Promise<void> {
  if (buf.length === 0 || dryRun) {
    return;
  }
  await dbK
    .insertInto('hive_engine_swaps')
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
  let buf: Omit<NewHiveEngineSwap, 'id' | 'symbols' | 'created_at'>[] = [];

  if (skipIndexes) {
    await dropSwapBulkIndexes(dbK);
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
          const row = mongoSwapToRow(item.value as MongoEngineAccountHistorySwap);
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
      await recreateSwapBulkIndexes(dbK);
    }

    console.log(
      `hive_engine_swaps import done: seen=${seen} buffered=${buffered} skipped=${skipped} dryRun=${dryRun}`,
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
    'Usage: pnpm migrate:mongo-hive-engine-swaps <path-to-engine_swaps.json> [--dry-run] [--skip-indexes]',
  );
  await migrateFile(filePath, dryRun, skipIndexes);
}

main().catch((e: Error) => fail(e.message));

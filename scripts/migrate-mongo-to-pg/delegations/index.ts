/**
 * Stream MongoDB `delegations` JSON array export into `user_delegations`.
 * Usage: pnpm migrate:mongo-delegations <path-to-delegations.json> [--skip-indexes]
 *
 * --skip-indexes  Drop secondary indexes on `user_delegations` before bulk insert;
 *                 recreate after.
 */

import * as fs from 'fs';
import * as path from 'path';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';

import { resolveConnectionString } from '../../../libs/migrations/src/connection';
import type { NewUserDelegation, OdlDatabase } from '@opden-data-layer/odl-db-types';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import streamArray from 'stream-json/streamers/stream-array.js';

import type { MongoDelegation } from './types';

const BATCH_SIZE = 5000;

interface MigrationStats {
  rowsSeen: number;
  rowsSkippedMissingPk: number;
  rowsSkippedUnderscoreInAccount: number;
  rowsBuffered: number;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseDelegationDate(value: string | undefined): Date | null {
  if (!value || value.trim() === '') {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

class MongoDelegationsMigrator {
  readonly db: Kysely<OdlDatabase>;

  private buffer: NewUserDelegation[] = [];

  readonly stats: MigrationStats = {
    rowsSeen: 0,
    rowsSkippedMissingPk: 0,
    rowsSkippedUnderscoreInAccount: 0,
    rowsBuffered: 0,
  };

  constructor(connectionString: string) {
    const pool = new Pool({ connectionString });
    this.db = new Kysely<OdlDatabase>({
      dialect: new PostgresDialect({ pool }),
    });
  }

  async destroy(): Promise<void> {
    await this.db.destroy();
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }
    const chunk = this.buffer;
    this.buffer = [];
    await this.db
      .insertInto('user_delegations')
      .values(chunk)
      .onConflict((oc) => oc.columns(['delegator', 'delegatee']).doNothing())
      .execute();
  }

  processRow(doc: MongoDelegation): void {
    this.stats.rowsSeen += 1;
    const delegator = doc.delegator?.trim().toLowerCase();
    const delegatee = doc.delegatee?.trim().toLowerCase();
    if (!delegator || !delegatee) {
      this.stats.rowsSkippedMissingPk += 1;
      return;
    }
    if (delegator.includes('_') || delegatee.includes('_')) {
      this.stats.rowsSkippedUnderscoreInAccount += 1;
      return;
    }
    const vestingShares = doc.vesting_shares ?? 0;
    if (vestingShares <= 0) {
      return;
    }

    this.buffer.push({
      delegator,
      delegatee,
      vesting_shares: vestingShares,
      delegation_date: parseDelegationDate(doc.delegation_date),
    });
    this.stats.rowsBuffered += 1;
  }

  async flushIfNeeded(): Promise<void> {
    if (this.buffer.length >= BATCH_SIZE) {
      await this.flush();
    }
  }

  async flushAll(): Promise<void> {
    await this.flush();
  }
}

async function dropDelegationsBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Dropping user_delegations indexes...');
  await sql`DROP INDEX IF EXISTS idx_user_delegations_delegatee`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_user_delegations_delegator`.execute(db);
  console.log('Indexes dropped.');
}

async function recreateDelegationsBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Recreating user_delegations indexes...');
  await sql`
    CREATE INDEX idx_user_delegations_delegatee ON user_delegations (delegatee)
  `.execute(db);
  await sql`
    CREATE INDEX idx_user_delegations_delegator ON user_delegations (delegator)
  `.execute(db);
  console.log('Indexes recreated.');
}

async function migrateFile(filePath: string, skipIndexes: boolean): Promise<void> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    fail(`File not found: ${resolved}`);
  }

  const migrator = new MongoDelegationsMigrator(resolveConnectionString());

  if (skipIndexes) {
    await dropDelegationsBulkIndexes(migrator.db);
  }

  try {
    const sink = new Writable({
      objectMode: true,
      write(
        item: { key: number; value: MongoDelegation },
        _encoding: BufferEncoding,
        callback: (err?: Error | null) => void,
      ) {
        migrator.processRow(item.value);
        migrator
          .flushIfNeeded()
          .then(() => {
            if ((item.key + 1) % 10000 === 0) {
              console.log(`Processed ${item.key + 1} delegations...`);
            }
            callback();
          })
          .catch((err: unknown) =>
            callback(err instanceof Error ? err : new Error(String(err))),
          );
      },
    });

    await streamPipeline(
      fs.createReadStream(resolved, { encoding: 'utf8' }),
      streamArray.withParserAsStream(),
      sink,
    );

    await migrator.flushAll();
  } finally {
    if (skipIndexes) {
      await recreateDelegationsBulkIndexes(migrator.db);
    }
    await migrator.destroy();
  }

  console.log('Delegation migration stats:', migrator.stats);
}

const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith('--'));
const skipIndexes = args.includes('--skip-indexes');
if (!filePath) {
  fail('Usage: pnpm migrate:mongo-delegations <path-to-delegations.json> [--skip-indexes]');
}

void migrateFile(filePath, skipIndexes).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

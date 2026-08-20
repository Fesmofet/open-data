/**
 * Stream MongoDB `user_expertise` JSON array export into `user_object_expertise`.
 * Usage: pnpm migrate:mongo-user-expertise <path-to-user_expertise.json> [--skip-indexes]
 *
 * Does not update `accounts_current.wobjects_weight` or `objects_core.weight` — those
 * come from separate Mongo users/wobjects imports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';

import { resolveConnectionString } from '../../../libs/migrations/src/connection';
import type { NewUserObjectExpertise, OdlDatabase } from '@opden-data-layer/odl-db-types';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import streamArray from 'stream-json/streamers/stream-array.js';

import type { MongoUserExpertise } from './types';

const BATCH_SIZE = 5000;
const PG_INSERT_CHUNK = 2000;

interface MigrationStats {
  rowsSeen: number;
  rowsSkippedMissingFields: number;
  rowsSkippedNonPositiveWeight: number;
  rowsSkippedUnknownObject: number;
  rowsSkippedUnknownAccount: number;
  rowsBuffered: number;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function* chunkSlices<T>(items: T[], chunkSize: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += chunkSize) {
    yield items.slice(i, i + chunkSize);
  }
}

class MongoUserExpertiseMigrator {
  readonly db: Kysely<OdlDatabase>;
  private readonly knownObjectIds = new Set<string>();
  private readonly knownAccounts = new Set<string>();
  private buffer: NewUserObjectExpertise[] = [];

  readonly stats: MigrationStats = {
    rowsSeen: 0,
    rowsSkippedMissingFields: 0,
    rowsSkippedNonPositiveWeight: 0,
    rowsSkippedUnknownObject: 0,
    rowsSkippedUnknownAccount: 0,
    rowsBuffered: 0,
  };

  constructor(connectionString: string) {
    const pool = new Pool({ connectionString });
    this.db = new Kysely<OdlDatabase>({
      dialect: new PostgresDialect({ pool }),
    });
  }

  async preloadFkSets(): Promise<void> {
    const objects = await this.db
      .selectFrom('objects_core')
      .select('object_id')
      .execute();
    for (const row of objects) {
      this.knownObjectIds.add(row.object_id);
    }

    const accounts = await this.db
      .selectFrom('accounts_current')
      .select('name')
      .execute();
    for (const row of accounts) {
      this.knownAccounts.add(row.name);
    }

    console.log(
      `Preloaded FK sets: ${this.knownObjectIds.size} objects, ${this.knownAccounts.size} accounts`,
    );
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
    for (const slice of chunkSlices(chunk, PG_INSERT_CHUNK)) {
      await this.db
        .insertInto('user_object_expertise')
        .values(slice)
        .onConflict((oc) =>
          oc.columns(['account', 'object_id']).doUpdateSet({
            weight: (eb) => eb.ref('excluded.weight'),
            updated_at: new Date().toISOString(),
          }),
        )
        .execute();
    }
  }

  processRow(doc: MongoUserExpertise): void {
    this.stats.rowsSeen += 1;
    const account = doc.user_name?.trim();
    const objectId = doc.author_permlink?.trim();
    const weight = doc.weight ?? 0;

    if (!account || !objectId) {
      this.stats.rowsSkippedMissingFields += 1;
      return;
    }
    if (weight <= 0) {
      this.stats.rowsSkippedNonPositiveWeight += 1;
      return;
    }
    if (!this.knownObjectIds.has(objectId)) {
      this.stats.rowsSkippedUnknownObject += 1;
      return;
    }
    if (!this.knownAccounts.has(account)) {
      this.stats.rowsSkippedUnknownAccount += 1;
      return;
    }

    this.buffer.push({
      account,
      object_id: objectId,
      weight,
      updated_at: new Date().toISOString(),
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

async function dropBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Dropping user_object_expertise indexes...');
  await sql`DROP INDEX IF EXISTS idx_user_object_expertise_account_weight`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_user_object_expertise_object_id`.execute(db);
}

async function recreateBulkIndexes(db: Kysely<OdlDatabase>): Promise<void> {
  console.log('Recreating user_object_expertise indexes...');
  await sql`
    CREATE INDEX idx_user_object_expertise_account_weight
    ON user_object_expertise (account, weight DESC)
  `.execute(db);
  await sql`
    CREATE INDEX idx_user_object_expertise_object_id
    ON user_object_expertise (object_id)
  `.execute(db);
}

async function migrateFile(filePath: string, skipIndexes: boolean): Promise<void> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    fail(`File not found: ${resolved}`);
  }

  const migrator = new MongoUserExpertiseMigrator(resolveConnectionString());

  if (skipIndexes) {
    await dropBulkIndexes(migrator.db);
  }

  try {
    await migrator.preloadFkSets();

    const sink = new Writable({
      objectMode: true,
      write(
        item: { key: number; value: MongoUserExpertise },
        _encoding: BufferEncoding,
        callback: (err?: Error | null) => void,
      ) {
        migrator.processRow(item.value);
        migrator
          .flushIfNeeded()
          .then(() => {
            if ((item.key + 1) % 10000 === 0) {
              console.log(`Processed ${item.key + 1} user_expertise rows...`);
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
      await recreateBulkIndexes(migrator.db);
    }
    await migrator.destroy();
  }

  console.log('Migration finished. Stats:', migrator.stats);
}

function main(): void {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith('--'));
  const skipIndexes = args.includes('--skip-indexes');

  if (!fileArg?.trim()) {
    fail(
      'Usage: tsx scripts/migrate-mongo-to-pg/user-expertise/index.ts <path-to-user_expertise.json> [--skip-indexes]',
    );
  }

  migrateFile(fileArg, skipIndexes).catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}

main();

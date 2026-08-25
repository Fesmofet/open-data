/**
 * Recompute materialized `objects_core.status` from vote-winning status updates.
 *
 * Usage:
 *   pnpm backfill:object-statuses [--dry-run] [--batch-size 200] [--object-id <id>]
 *
 * Requires POSTGRES_* and optionally GOVERNANCE_OBJECT_ID (same as chain-indexer).
 */
import type { OdlDatabase } from '@opden-data-layer/odl-db-types';
import { UPDATE_TYPES } from '@opden-data-layer/core';
import {
  materializeObjectCoreStatus,
  ObjectViewService,
} from '@opden-data-layer/objects-domain';
import { resolveConnectionString } from '../libs/migrations/src/connection';
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import { loadAggregatedByObjectIds } from './lib/load-aggregated-objects';
import { resolvePlatformGovernance } from './lib/resolve-platform-governance';

interface CliOptions {
  dryRun: boolean;
  batchSize: number;
  objectId: string | null;
}

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let batchSize = 200;
  let objectId: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (a === '--batch-size' && argv[i + 1]) {
      const n = Number.parseInt(argv[++i] ?? '', 10);
      if (Number.isFinite(n) && n > 0) {
        batchSize = Math.min(n, 2000);
      }
      continue;
    }
    if (a === '--object-id' && argv[i + 1]) {
      objectId = (argv[++i] ?? '').trim() || null;
      continue;
    }
    if (a.startsWith('--object-id=')) {
      objectId = a.slice('--object-id='.length).trim() || null;
    }
  }

  return { dryRun, batchSize, objectId };
}

function fail(message: string): never {
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const pool = new pg.Pool({ connectionString: resolveConnectionString() });
  const db = new Kysely<OdlDatabase>({ dialect: new PostgresDialect({ pool }) });
  const objectViewService = new ObjectViewService();

  const governanceObjectId = (process.env['GOVERNANCE_OBJECT_ID'] ?? '').trim();
  // eslint-disable-next-line no-console
  console.log(
    `Starting object status backfill dry_run=${opts.dryRun} batch_size=${opts.batchSize} governance_object_id=${governanceObjectId || '(default)'}`,
  );

  let scanned = 0;
  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  try {
    const governance = await resolvePlatformGovernance(db, governanceObjectId);

    let objectIds: string[];
    if (opts.objectId) {
      objectIds = [opts.objectId];
    } else {
      const rows = await db
        .selectFrom('object_updates')
        .select('object_id')
        .where('update_type', '=', UPDATE_TYPES.STATUS)
        .distinct()
        .execute();
      objectIds = rows.map((r) => r.object_id);
    }

    // eslint-disable-next-line no-console
    console.log(`Found ${objectIds.length} object(s) with status update history.`);

    for (const batch of chunk(objectIds, opts.batchSize)) {
      const { objects, voterWaivPowers } = await loadAggregatedByObjectIds(db, batch);

      for (const agg of objects) {
        scanned += 1;
        const objectId = agg.core.object_id;
        const currentStatus = agg.core.status;

        try {
          const nextStatus = materializeObjectCoreStatus(
            agg,
            voterWaivPowers,
            governance,
            objectViewService,
          );

          if (nextStatus === currentStatus) {
            unchanged += 1;
            continue;
          }

          if (opts.dryRun) {
            // eslint-disable-next-line no-console
            console.log(`[dry-run] ${objectId}: ${currentStatus} -> ${nextStatus}`);
            updated += 1;
            continue;
          }

          const result = await sql`
            UPDATE objects_core
            SET status = ${nextStatus}
            WHERE object_id = ${objectId}
              AND status IS DISTINCT FROM ${nextStatus}
          `.execute(db);

          const numUpdated = Number(result.numUpdatedRows ?? 0);
          if (numUpdated > 0) {
            updated += 1;
            // eslint-disable-next-line no-console
            console.log(`${objectId}: ${currentStatus} -> ${nextStatus}`);
          } else {
            unchanged += 1;
          }
        } catch (error) {
          errors += 1;
          // eslint-disable-next-line no-console
          console.error(
            `Failed ${objectId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `Done. scanned=${scanned} updated=${updated} unchanged=${unchanged} errors=${errors} dry_run=${opts.dryRun}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  fail(e instanceof Error ? e.message : String(e));
});

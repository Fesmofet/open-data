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
import { Kysely, PostgresDialect } from 'kysely';
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
  let alreadyCorrect = 0;
  let rowsWritten = 0;
  let wouldWrite = 0;
  let missingCore = 0;
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
      const loadedIds = new Set(objects.map((o) => o.core.object_id));

      for (const objectId of batch) {
        if (!loadedIds.has(objectId)) {
          missingCore += 1;
          // eslint-disable-next-line no-console
          console.warn(`Skip ${objectId}: no objects_core row`);
          continue;
        }
      }

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
            alreadyCorrect += 1;
            continue;
          }

          if (opts.dryRun) {
            wouldWrite += 1;
            // eslint-disable-next-line no-console
            console.log(`[dry-run] ${objectId}: ${currentStatus} -> ${nextStatus}`);
            continue;
          }

          const result = await db
            .updateTable('objects_core')
            .set({ status: nextStatus })
            .where('object_id', '=', objectId)
            .where('status', 'is distinct from', nextStatus)
            .executeTakeFirst();

          const numUpdated = Number(result.numUpdatedRows ?? 0);
          if (numUpdated > 0) {
            rowsWritten += 1;
            // eslint-disable-next-line no-console
            console.log(`updated ${objectId}: ${currentStatus} -> ${nextStatus}`);
          } else {
            // Concurrent writer (e.g. chain-indexer) applied the same status first.
            alreadyCorrect += 1;
            // eslint-disable-next-line no-console
            console.log(
              `skip ${objectId}: already ${nextStatus} (race with live indexer?)`,
            );
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

    if (opts.dryRun) {
      // eslint-disable-next-line no-console
      console.log(
        `Done (dry run, no writes). scanned=${scanned} would_write=${wouldWrite} already_correct=${alreadyCorrect} missing_core=${missingCore} errors=${errors}`,
      );
    } else if (rowsWritten === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `Done. scanned=${scanned} rows_written=0 already_correct=${alreadyCorrect} missing_core=${missingCore} errors=${errors}`,
      );
      // eslint-disable-next-line no-console
      console.log(
        'No database writes — materialized status already matched objects_core for every scanned object (often because chain-indexer already recomputed them).',
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `Done. scanned=${scanned} rows_written=${rowsWritten} already_correct=${alreadyCorrect} missing_core=${missingCore} errors=${errors}`,
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  fail(e instanceof Error ? e.message : String(e));
});

/**
 * Refresh stale Hive payout columns on root posts from condenser_api.get_content.
 *
 * Usage:
 *   POSTGRES_HOST=localhost POSTGRES_PORT=12003 ... \
 *   pnpm exec tsx scripts/backfill-post-hive-payouts.ts sagarkothari88
 *
 * Options:
 *   --limit=N     Max posts to update (default 100)
 *   --min-votes=N Only posts with at least N active votes (default 5)
 *   --dry-run     Print planned updates without writing
 */
import { parsePayoutAmount } from '../libs/core/src/post-reward/parse-payout-amount';
import { hivePayoutFieldsFromContent } from '../apps/chain-indexer/src/domain/hive-vote/hive-payout-from-content';
import { resolveConnectionString } from '../libs/migrations/src/connection';
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';

const HIVE_API = process.env['HIVE_NODE'] ?? 'https://api.hive.blog';
const HIVE_DELAY_MS = Number(process.env['HIVE_RPC_DELAY_MS'] ?? 250);

type StalePostRow = {
  author: string;
  permlink: string;
  pending_payout_value: string;
  total_pending_payout_value: string;
  vote_count: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]): {
  author?: string;
  limit: number;
  minVotes: number;
  dryRun: boolean;
} {
  let author: string | undefined;
  let limit = 100;
  let minVotes = 5;
  let dryRun = false;
  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length));
    } else if (arg.startsWith('--min-votes=')) {
      minVotes = Number(arg.slice('--min-votes='.length));
    } else if (!arg.startsWith('--')) {
      author = arg.trim().toLowerCase();
    }
  }
  return {
    author,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    minVotes: Number.isFinite(minVotes) && minVotes > 0 ? minVotes : 5,
    dryRun,
  };
}

async function hiveGetContent(
  author: string,
  permlink: string,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(HIVE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_content',
      params: [author, permlink],
      id: 1,
    }),
  });
  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as { result?: Record<string, unknown> };
  const result = json.result;
  if (!result || typeof result.author !== 'string' || !result.author.trim()) {
    return null;
  }
  return result;
}

async function main(): Promise<void> {
  const { author, limit, minVotes, dryRun } = parseArgs(process.argv.slice(2));

  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: resolveConnectionString() }),
    }),
  });

  try {
    let query = db
      .selectFrom('posts as p')
      .innerJoin('post_active_votes as v', (join) =>
        join
          .onRef('v.author', '=', 'p.author')
          .onRef('v.permlink', '=', 'p.permlink'),
      )
      .select([
        'p.author',
        'p.permlink',
        'p.pending_payout_value',
        'p.total_pending_payout_value',
        sql<number>`count(v.voter)::int`.as('vote_count'),
      ])
      .where((eb) =>
        eb.or([eb('p.depth', '=', 0), eb('p.depth', 'is', null)]),
      )
      .where('p.rewards_finalized_at', 'is', null)
      .where((eb) =>
        eb.and([
          eb('p.pending_payout_value', 'in', ['0.000 HBD', '0', '']),
          eb('p.total_pending_payout_value', 'in', ['0.000 HBD', '0', '']),
        ]),
      )
      .groupBy([
        'p.author',
        'p.permlink',
        'p.pending_payout_value',
        'p.total_pending_payout_value',
      ])
      .having(sql`count(v.voter)`, '>=', minVotes)
      .orderBy(sql`max(p.created_unix)`, 'desc')
      .limit(limit);

    if (author) {
      query = query.where('p.author', '=', author);
    }

    const stale = (await query.execute()) as StalePostRow[];
    console.log(
      `Found ${stale.length} stale root post(s)${author ? ` for @${author}` : ''} (min ${minVotes} votes)`,
    );
    if (dryRun) {
      console.log('Dry run — no writes.');
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of stale) {
      const hive = await hiveGetContent(row.author, row.permlink);
      await sleep(HIVE_DELAY_MS);
      if (!hive) {
        failed += 1;
        console.log(`FAIL ${row.author}/${row.permlink}: getContent`);
        continue;
      }

      const pending = parsePayoutAmount(String(hive.pending_payout_value ?? ''));
      const totalPending = parsePayoutAmount(
        String(hive.total_pending_payout_value ?? ''),
      );
      if (pending <= 0 && totalPending <= 0) {
        skipped += 1;
        console.log(
          `SKIP ${row.author}/${row.permlink}: Hive payout also zero (${row.vote_count} votes)`,
        );
        continue;
      }

      const fields = hivePayoutFieldsFromContent(hive as never);
      if (!dryRun) {
        await db
          .updateTable('posts')
          .set(fields)
          .where('author', '=', row.author)
          .where('permlink', '=', row.permlink)
          .execute();
      }

      updated += 1;
      console.log(
        `${dryRun ? 'WOULD UPDATE' : 'UPDATED'} ${row.author}/${row.permlink}: pending=${fields.pending_payout_value} net_rshares=${fields.net_rshares?.toString() ?? '0'} (${row.vote_count} votes)`,
      );
    }

    console.log(
      `\nDone: updated=${updated} skipped=${skipped} failed=${failed}${dryRun ? ' (dry-run)' : ''}`,
    );
  } finally {
    await db.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

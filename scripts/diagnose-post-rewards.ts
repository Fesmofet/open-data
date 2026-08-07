/**
 * Diagnose post reward / waiv-post-reconcile pipeline for an author.
 *
 * Usage:
 *   POSTGRES_HOST=localhost POSTGRES_PORT=12003 POSTGRES_USER=postgres \
 *   POSTGRES_PASSWORD=... POSTGRES_DATABASE=odl \
 *   REDIS_URI=redis://localhost:6379 \
 *   pnpm exec tsx scripts/diagnose-post-rewards.ts sagarkothari88
 *
 * Optional: --hive — fetch Hive getContent for top posts and compare payout fields.
 */
import { calculatePostRewardUsd } from '../libs/core/src/post-reward/calculate-post-reward-usd';
import { parsePayoutAmount } from '../libs/core/src/post-reward/parse-payout-amount';
import type { PostRewardInput } from '../libs/core/src/post-reward/post-reward.types';
import { resolveConnectionString } from '../libs/migrations/src/connection';
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';

const RECONCILE_QUEUE_KEY = 'chain-indexer:queue:post-waiv-reconcile';
const HIVE_API = process.env['HIVE_NODE'] ?? 'https://api.hive.blog';

type PostRow = {
  author: string;
  permlink: string;
  title: string | null;
  depth: number | null;
  created_unix: number;
  pending_payout_value: string;
  total_pending_payout_value: string;
  total_payout_value: string;
  curator_payout_value: string;
  cashout_time: string | null;
  net_rshares: bigint | string | number | null;
  rewards_finalized_at: string | null;
  vote_count: number;
};

function buildRewardInput(row: PostRow): PostRewardInput {
  return {
    pendingPayoutValue: row.pending_payout_value ?? '',
    totalPayoutValue: row.total_payout_value ?? '',
    curatorPayoutValue: row.curator_payout_value ?? '',
    maxAcceptedPayout: '1000000.000 HBD',
    cashoutTime: row.cashout_time,
    percentHbd: 10000,
    promoted: '0.000 HBD',
    totalPayoutWaiv: 0,
    totalRewardsWaiv: 0,
    beneficiaries: [],
    jsonMetadata: null,
  };
}

function formatAge(createdUnix: number): string {
  const hours = (Date.now() / 1000 - createdUnix) / 3600;
  if (hours < 48) {
    return `${hours.toFixed(1)}h ago`;
  }
  return `${(hours / 24).toFixed(1)}d ago`;
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

async function inspectRedis(author: string): Promise<void> {
  const redisUri = process.env['REDIS_URI'] ?? 'redis://localhost:6379';
  console.log(`\n=== Redis (${redisUri}) ===`);
  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(redisUri, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    const queueSize = await client.zcard(RECONCILE_QUEUE_KEY);
    console.log(`Queue ${RECONCILE_QUEUE_KEY}: ${queueSize} member(s)`);

    const authorMembers = await client.zrangebyscore(
      RECONCILE_QUEUE_KEY,
      '-inf',
      '+inf',
    );
    const authorQueued = authorMembers.filter((m: string) =>
      m.toLowerCase().startsWith(`${author.toLowerCase()}:`),
    );
    console.log(`Queued for ${author}: ${authorQueued.length}`);
    for (const m of authorQueued.slice(0, 10)) {
      const score = await client.zscore(RECONCILE_QUEUE_KEY, m);
      const scoreDate =
        score != null ? new Date(Number(score) * 1000).toISOString() : '?';
      console.log(`  ${m} (enqueued ${scoreDate})`);
    }
    if (authorQueued.length > 10) {
      console.log(`  ... and ${authorQueued.length - 10} more`);
    }

    const oldest = await client.zrange(RECONCILE_QUEUE_KEY, 0, 4, 'WITHSCORES');
    if (oldest.length > 0) {
      console.log('Oldest queue entries (global):');
      for (let i = 0; i < oldest.length; i += 2) {
        const value = oldest[i];
        const score = oldest[i + 1];
        console.log(
          `  ${value} score=${score} (${new Date(Number(score) * 1000).toISOString()})`,
        );
      }
    }
    await client.quit();
  } catch (e) {
    console.log(`Redis unavailable: ${(e as Error).message}`);
  }
}

async function inspectScheduler(db: Kysely<unknown>): Promise<void> {
  console.log('\n=== Scheduler job runs ===');
  const jobs = ['waiv-post-reconcile', 'post-rewards-finalize'];
  for (const jobName of jobs) {
    const recent = await db
      .selectFrom('scheduler_job_runs')
      .select([
        'id',
        'job_name',
        'status',
        'attempt',
        'created_at',
        'started_at',
        'finished_at',
        'error',
      ])
      .where('job_name', '=', jobName)
      .orderBy('created_at', 'desc')
      .limit(8)
      .execute();

    console.log(`\n${jobName} (last ${recent.length} runs):`);
    if (recent.length === 0) {
      console.log('  (no runs recorded — scheduler may never have run)');
      continue;
    }
    for (const r of recent) {
      const err =
        r.error != null && String(r.error).trim() !== ''
          ? ` err=${String(r.error).slice(0, 120)}`
          : '';
      console.log(
        `  ${r.created_at?.toISOString?.() ?? r.created_at} status=${r.status} attempt=${r.attempt}${err}`,
      );
    }

    const counts = await db
      .selectFrom('scheduler_job_runs')
      .select([
        sql<number>`count(*)::int`.as('total'),
        sql<number>`count(*) filter (where status = 'success')::int`.as('completed'),
        sql<number>`count(*) filter (where status = 'failed')::int`.as('failed'),
        sql<number>`max(created_at)`.as('last_run'),
      ])
      .where('job_name', '=', jobName)
      .executeTakeFirst();
    console.log(
      `  totals: ${counts?.total ?? 0} runs, ${counts?.completed ?? 0} completed, ${counts?.failed ?? 0} failed, last=${counts?.last_run ?? 'never'}`,
    );
  }

  const stuckQueue = await db
    .selectFrom('scheduler_job_queue as q')
    .innerJoin('scheduler_job_runs as r', 'r.id', 'q.run_id')
    .select(['r.job_name', 'q.status', sql<number>`count(*)::int`.as('n')])
    .where('r.job_name', 'in', jobs)
    .groupBy(['r.job_name', 'q.status'])
    .execute();
  if (stuckQueue.length > 0) {
    console.log('\nScheduler internal queue:');
    for (const row of stuckQueue) {
      console.log(`  ${row.job_name} status=${row.status}: ${row.n}`);
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const withHive = process.argv.includes('--hive');
  const author = (args[0] ?? 'sagarkothari88').trim().toLowerCase();
  const limit = Number(args[1] ?? 15);

  console.log(`Post reward diagnostics for @${author}`);
  console.log(
    `DB: ${process.env['POSTGRES_HOST'] ?? '?'}:${process.env['POSTGRES_PORT'] ?? '5432'}/${process.env['POSTGRES_DATABASE'] ?? '?'}`,
  );

  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: resolveConnectionString() }),
    }),
  });

  try {
    const posts = await db
      .selectFrom('posts as p')
      .leftJoin('post_active_votes as v', (join) =>
        join
          .onRef('v.author', '=', 'p.author')
          .onRef('v.permlink', '=', 'p.permlink'),
      )
      .select([
        'p.author',
        'p.permlink',
        'p.title',
        'p.depth',
        'p.created_unix',
        'p.pending_payout_value',
        'p.total_pending_payout_value',
        'p.total_payout_value',
        'p.curator_payout_value',
        'p.cashout_time',
        'p.net_rshares',
        'p.rewards_finalized_at',
        sql<number>`count(v.voter)::int`.as('vote_count'),
      ])
      .where('p.author', '=', author)
      .where((eb) =>
        eb.or([eb('p.depth', '=', 0), eb('p.depth', 'is', null)]),
      )
      .groupBy([
        'p.author',
        'p.permlink',
        'p.title',
        'p.depth',
        'p.created_unix',
        'p.pending_payout_value',
        'p.total_pending_payout_value',
        'p.total_payout_value',
        'p.curator_payout_value',
        'p.cashout_time',
        'p.net_rshares',
        'p.rewards_finalized_at',
      ])
      .orderBy('p.created_unix', 'desc')
      .limit(limit)
      .execute();

    console.log(`\n=== Root posts (top ${posts.length}) ===`);
    if (posts.length === 0) {
      console.log('No root posts found.');
    }

    let staleWithVotes = 0;
    for (const row of posts as PostRow[]) {
      const input = buildRewardInput(row);
      const reward = calculatePostRewardUsd(input, 0);
      const pending = parsePayoutAmount(row.pending_payout_value);
      const totalPending = parsePayoutAmount(row.total_pending_payout_value);
      const hasStalePayout =
        row.vote_count >= 5 && pending <= 0 && totalPending <= 0;
      if (hasStalePayout) {
        staleWithVotes += 1;
      }

      console.log(
        `\n${row.author}/${row.permlink}`,
      );
      console.log(`  title: ${(row.title ?? '').slice(0, 70)}`);
      console.log(
        `  age: ${formatAge(row.created_unix)} | votes: ${row.vote_count} | depth: ${row.depth ?? 'null'}`,
      );
      console.log(
        `  pending=${row.pending_payout_value} total_pending=${row.total_pending_payout_value}`,
      );
      console.log(
        `  net_rshares=${row.net_rshares ?? 0} cashout=${row.cashout_time ?? 'null'}`,
      );
      console.log(
        `  reward calc: ${reward ? `$${reward.potentialUsd.toFixed(2)} (${reward.phase})` : 'null (badge hidden)'}`,
      );
      if (hasStalePayout) {
        console.log('  ⚠ STALE: many votes but zero payout in DB');
      }

      if (withHive && hasStalePayout) {
        const hive = await hiveGetContent(row.author, row.permlink);
        if (hive) {
          console.log(
            `  Hive live: pending=${hive.pending_payout_value} total_pending=${hive.total_pending_payout_value} net_rshares=${hive.net_rshares}`,
          );
        } else {
          console.log('  Hive live: getContent failed');
        }
      }
    }

    const summary = await db
      .selectFrom('posts as p')
      .leftJoin('post_active_votes as v', (join) =>
        join
          .onRef('v.author', '=', 'p.author')
          .onRef('v.permlink', '=', 'p.permlink'),
      )
      .select([
        sql<number>`count(distinct p.permlink)::int`.as('posts'),
        sql<number>`count(v.voter)::int`.as('votes'),
      ])
      .where('p.author', '=', author)
      .where((eb) =>
        eb.or([eb('p.depth', '=', 0), eb('p.depth', 'is', null)]),
      )
      .executeTakeFirst();

    console.log('\n=== Summary ===');
    console.log(`Root posts: ${summary?.posts ?? 0}`);
    console.log(`Total active votes: ${summary?.votes ?? 0}`);
    console.log(
      `Posts with ≥5 votes but zero DB payout (sample): ${staleWithVotes}`,
    );

    await inspectScheduler(db);
    await inspectRedis(author);

    const batchPerHour = 1000;
    console.log('\n=== Reconcile queue analysis ===');
    console.log(
      'waiv-post-reconcile processes POST_REWARD_RECONCILE_BATCH_SIZE posts per hour (default 1000).',
    );
    console.log(
      'Set REDIS_URI to the same Redis as chain-indexer (not localhost unless local stack).',
    );
    console.log(
      'Queue uses newest-first claim after fix; previously oldest-first caused multi-day lag.',
    );
    console.log(
      `At ${batchPerHour}/hour, a 7900+ backlog needs ~${Math.ceil(7932 / batchPerHour)} hours to drain.`,
    );
    console.log(
      'Recent posts not in queue may never have been enqueued (mongo import) — run backfill-post-hive-payouts.ts',
    );

    console.log('\n=== Likely causes ===');
    console.log(
      '1. Redis reconcile backlog (7932+ entries) — job only refreshed oldest posts first',
    );
    console.log(
      '2. Stale posts never enqueued — mongo import / missed markDirty; pending stays 0.000 HBD',
    );
    console.log(
      '3. HivePostSyncWorker synced votes but not payout fields (fixed in chain-indexer)',
    );
    console.log(
      '4. waiv-post-reconcile job failing (check scheduler_job_runs.error)',
    );
    console.log(
      '\nManual fix: pnpm exec tsx scripts/backfill-post-hive-payouts.ts <author>',
    );
    console.log(
      'Or: pnpm nx serve scheduler -- --run-job=waiv-post-reconcile',
    );
  } finally {
    await db.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

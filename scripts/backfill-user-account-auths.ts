/**
 * Backfill Hive account_auths edges from condenser_api.get_accounts snapshots.
 *
 * Usage:
 *   POSTGRES_HOST=localhost ... pnpm backfill:user-account-auths
 *
 * Options:
 *   --source=users|all-hive   Default users (accounts_current)
 *   --batch-size=N            Default/max 100
 *   --delay-ms=N              Default 250 (or HIVE_RPC_DELAY_MS)
 *   --account=name            Single account
 *   --dry-run                 No DB writes
 *   --force                   Ignore user_account_auth_sync checkpoint
 */
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import type { OdlDatabase } from '@opden-data-layer/odl-db-types';
import type { HiveAccountType } from '@opden-data-layer/clients';
import {
  HIVE_ACCOUNT_AUTHORITY_TYPES,
  parseAccountAuthorityFromHiveAccount,
} from '../apps/chain-indexer/src/domain/hive-social/account-authority.parse';
import { resolveConnectionString } from '../libs/migrations/src/connection';
import {
  clampBackfillBatchSize,
  nextLookupAccountsLowerBound,
  nextUserBatchCursor,
  resolveBackfillDelayMs,
} from '../apps/chain-indexer/src/domain/hive-social/backfill-account-auth.helpers';
import { shouldApplyAuthorityReplace } from '../apps/chain-indexer/src/domain/hive-social/account-authority-guard';

const HIVE_API = process.env['HIVE_NODE'] ?? 'https://api.hive.blog';

type CliArgs = {
  source: 'users' | 'all-hive';
  batchSize: number;
  delayMs: number;
  account?: string;
  dryRun: boolean;
  force: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]): CliArgs {
  let source: 'users' | 'all-hive' = 'users';
  let batchSize = 100;
  let delayMs = resolveBackfillDelayMs(undefined, process.env['HIVE_RPC_DELAY_MS']);
  let account: string | undefined;
  let dryRun = false;
  let force = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--force') {
      force = true;
    } else if (arg.startsWith('--source=')) {
      const v = arg.slice('--source='.length);
      if (v === 'users' || v === 'all-hive') {
        source = v;
      }
    } else if (arg.startsWith('--batch-size=')) {
      batchSize = clampBackfillBatchSize(Number(arg.slice('--batch-size='.length)));
    } else if (arg.startsWith('--delay-ms=')) {
      delayMs = resolveBackfillDelayMs(
        Number(arg.slice('--delay-ms='.length)),
        process.env['HIVE_RPC_DELAY_MS'],
      );
    } else if (arg.startsWith('--account=')) {
      account = arg.slice('--account='.length).trim().toLowerCase();
    } else if (!arg.startsWith('--')) {
      account = arg.trim().toLowerCase();
    }
  }

  return {
    source,
    batchSize: clampBackfillBatchSize(batchSize),
    delayMs,
    account,
    dryRun,
    force,
  };
}

async function hiveRpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const res = await fetch(HIVE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as { result?: T; error?: unknown };
  if (json.error || json.result === undefined) {
    return null;
  }
  return json.result;
}

async function fetchHeadBlock(): Promise<number> {
  const props = await hiveRpc<{ head_block_number?: number }>(
    'condenser_api.get_dynamic_global_properties',
    [],
  );
  return Number(props?.head_block_number ?? 0);
}

async function fetchAccounts(names: string[]): Promise<HiveAccountType[]> {
  if (names.length === 0) {
    return [];
  }
  const result = await hiveRpc<HiveAccountType[]>('condenser_api.get_accounts', [names]);
  return result ?? [];
}

async function lookupAccounts(lowerBound: string, limit: number): Promise<string[]> {
  const result = await hiveRpc<string[] | { accounts?: string[] }>(
    'condenser_api.lookup_accounts',
    [lowerBound, limit],
  );
  if (!result) {
    return [];
  }
  if (Array.isArray(result)) {
    return result;
  }
  return result.accounts ?? [];
}

async function replaceAccountSnapshot(
  db: Kysely<OdlDatabase>,
  account: HiveAccountType,
  headBlock: number,
  dryRun: boolean,
): Promise<void> {
  const parsed = parseAccountAuthorityFromHiveAccount(account);
  const grantor = parsed.grantor;

  if (dryRun) {
    console.log(
      `DRY ${grantor}: owner=${(parsed.types.owner ?? []).join(',') || '-'} active=${(parsed.types.active ?? []).join(',') || '-'} posting=${(parsed.types.posting ?? []).join(',') || '-'}`,
    );
    return;
  }

  await db.transaction().execute(async (trx) => {
    for (const type of HIVE_ACCOUNT_AUTHORITY_TYPES) {
      const grantees = parsed.types[type] ?? [];
      const maxRow = await trx
        .selectFrom('user_account_auths')
        .select((eb) => eb.fn.max('updated_at_block').as('max_block'))
        .where('grantor', '=', grantor)
        .where('authority_type', '=', type)
        .executeTakeFirst();
      const maxBlock =
        maxRow?.max_block !== null && maxRow?.max_block !== undefined
          ? Number(maxRow.max_block)
          : null;
      if (!shouldApplyAuthorityReplace(headBlock, maxBlock)) {
        continue;
      }

      await trx
        .deleteFrom('user_account_auths')
        .where('grantor', '=', grantor)
        .where('authority_type', '=', type)
        .where('updated_at_block', '<=', headBlock)
        .execute();

      if (grantees.length > 0) {
        await trx
          .insertInto('user_account_auths')
          .values(
            grantees.map((grantee) => ({
              grantor,
              authority_type: type,
              grantee,
              updated_at_block: headBlock,
            })),
          )
          .execute();
      }
    }

    await trx
      .insertInto('user_account_auth_sync')
      .values({
        account: grantor,
        synced_at: new Date(),
        synced_block: headBlock,
      })
      .onConflict((oc) =>
        oc.column('account').doUpdateSet({
          synced_at: new Date(),
          synced_block: sql`GREATEST(user_account_auth_sync.synced_block, ${headBlock})`,
        }),
      )
      .execute();
  });
}

async function fetchUnsyncedUserNames(
  db: Kysely<OdlDatabase>,
  lastAccount: string,
  batchSize: number,
  force: boolean,
  singleAccount?: string,
): Promise<string[]> {
  if (singleAccount) {
    return [singleAccount];
  }

  let qb = db
    .selectFrom('accounts_current as ac')
    .select('ac.name')
    .where('ac.name', '>', lastAccount)
    .orderBy('ac.name', 'asc')
    .limit(batchSize);

  if (!force) {
    qb = qb.where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom('user_account_auth_sync as s')
            .select('s.account')
            .whereRef('s.account', '=', 'ac.name'),
        ),
      ),
    );
  }

  const rows = await qb.execute();
  return rows.map((r) => r.name);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const db = new Kysely<OdlDatabase>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: resolveConnectionString() }),
    }),
  });

  try {
    const headBlock = await fetchHeadBlock();
    if (headBlock <= 0) {
      throw new Error('Could not resolve Hive head block');
    }
    console.log(`Head block: ${headBlock}, batch=${args.batchSize}, delay=${args.delayMs}ms`);

    let processed = 0;
    let lastAccount = '';

    if (args.source === 'all-hive') {
      let lower = args.account ?? lastAccount;
      for (;;) {
        const names = await lookupAccounts(lower, args.batchSize);
        await sleep(args.delayMs);
        if (names.length === 0) {
          break;
        }
        const accounts = await fetchAccounts(names);
        await sleep(args.delayMs);
        for (const account of accounts) {
          if (!account?.name) {
            continue;
          }
          if (!args.force) {
            const synced = await db
              .selectFrom('user_account_auth_sync')
              .select('account')
              .where('account', '=', account.name)
              .executeTakeFirst();
            if (synced && !args.account) {
              continue;
            }
          }
          await replaceAccountSnapshot(db, account, headBlock, args.dryRun);
          processed += 1;
        }
        lower = nextLookupAccountsLowerBound(names[names.length - 1] ?? lower);
        if (args.account) {
          break;
        }
        if (names.length < args.batchSize) {
          break;
        }
      }
    } else {
      for (;;) {
        const names = await fetchUnsyncedUserNames(
          db,
          lastAccount,
          args.batchSize,
          args.force,
          args.account,
        );
        if (names.length === 0) {
          break;
        }

        let accounts: HiveAccountType[] = [];
        try {
          accounts = await fetchAccounts(names);
        } finally {
          await sleep(args.delayMs);
        }

        const appliedNames: string[] = [];
        for (const account of accounts) {
          if (!account?.name) {
            continue;
          }
          await replaceAccountSnapshot(db, account, headBlock, args.dryRun);
          processed += 1;
          appliedNames.push(account.name);
        }

        lastAccount = nextUserBatchCursor(lastAccount, appliedNames);
        if (args.account) {
          break;
        }
      }
    }

    console.log(`Done: processed=${processed}${args.dryRun ? ' (dry-run)' : ''}`);
  } finally {
    await db.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Inspect OBL ledger + balance for an account pair.
 *
 * Usage:
 *   pnpm exec tsx --env-file=.env scripts/inspect-obl-pair-balance.ts flowmaster fesmofet
 */
import type { OdlDatabase } from '../libs/core/src/db';
import { computePairBalance } from '../apps/query-api/src/domain/obl/compute-pair-balance';
import { resolveConnectionString } from '../libs/migrations/src/connection';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

function normalizePair(a: string, b: string): { pairLow: string; pairHigh: string } {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x <= y ? { pairLow: x, pairHigh: y } : { pairLow: y, pairHigh: x };
}

function directionalForViewer(
  viewer: string,
  accountA: string,
  accountB: string,
  bucket: { owesAtoB: string; owesBtoA: string; netUsd: string },
): { viewerOwes: number; owesViewer: number; label: string } {
  const owesAtoB = Number(bucket.owesAtoB) || 0;
  const owesBtoA = Number(bucket.owesBtoA) || 0;
  let viewerOwes: number;
  let owesViewer: number;
  if (viewer === accountA) {
    viewerOwes = owesAtoB;
    owesViewer = owesBtoA;
  } else if (viewer === accountB) {
    viewerOwes = owesBtoA;
    owesViewer = owesAtoB;
  } else {
    viewerOwes = owesAtoB;
    owesViewer = owesBtoA;
  }

  let label: string;
  if (owesViewer > 0 && viewerOwes === 0) {
    label = `@${viewer === accountA ? accountB : accountA} owes you $${owesViewer.toFixed(2)}`;
  } else if (viewerOwes > 0 && owesViewer === 0) {
    label = `You owe $${viewerOwes.toFixed(2)}`;
  } else if (viewerOwes > 0 && owesViewer > 0) {
    const net = owesViewer - viewerOwes;
    if (net > 0) label = `counterparty owes you $${net.toFixed(2)} (gross both sides)`;
    else if (net < 0) label = `you owe $${Math.abs(net).toFixed(2)} (gross both sides)`;
    else label = 'Settled (gross both sides cancel)';
  } else {
    label = 'Settled';
  }

  return { viewerOwes, owesViewer, label };
}

async function main(): Promise<void> {
  const accountA = (process.argv[2] ?? 'flowmaster').toLowerCase();
  const accountB = (process.argv[3] ?? 'fesmofet').toLowerCase();
  const { pairLow, pairHigh } = normalizePair(accountA, accountB);

  const db = new Kysely<OdlDatabase>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: resolveConnectionString() }),
    }),
  });

  try {
    const ledger = await db
      .selectFrom('obl_ledgers')
      .selectAll()
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .executeTakeFirst();

    const contracts = await db
      .selectFrom('obl_contracts')
      .selectAll()
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'asc')
      .execute();

    const allInvoices = await db
      .selectFrom('obl_invoices')
      .selectAll()
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'asc')
      .execute();

    const allPayments = await db
      .selectFrom('obl_payments')
      .selectAll()
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'asc')
      .execute();

    const startedSeq =
      ledger?.started_event_seq ??
      (contracts.length > 0
        ? contracts.reduce(
            (min, c) => (c.created_event_seq < min ? c.created_event_seq : min),
            contracts[0]!.created_event_seq,
          )
        : null);

    const invoices =
      startedSeq !== null
        ? allInvoices.filter((row) => row.created_event_seq >= startedSeq)
        : allInvoices;
    const payments =
      startedSeq !== null
        ? allPayments.filter((row) => row.created_event_seq >= startedSeq)
        : allPayments;

    const balance = computePairBalance(
      accountA,
      accountB,
      invoices.map((inv) => ({
        debtor: inv.debtor,
        creditor: inv.creditor,
        amount_usd: String(inv.amount_usd),
        final_amount_usd:
          inv.final_amount_usd !== null && inv.final_amount_usd !== undefined
            ? String(inv.final_amount_usd)
            : null,
        state: inv.state,
      })),
      payments.map((pay) => ({
        payer: pay.payer,
        receiver: pay.receiver,
        amount_usd: String(pay.amount_usd),
        state: pay.state,
      })),
    );

    console.log('=== OBL pair inspection ===');
    console.log(`accountA (request order): ${accountA}`);
    console.log(`accountB (request order): ${accountB}`);
    console.log(`pairLow/pairHigh: ${pairLow} / ${pairHigh}`);
    console.log(`started_event_seq: ${startedSeq?.toString() ?? 'null'}`);
    console.log(`contracts: ${contracts.length}`);
    console.log(`invoices (all / in ledger): ${allInvoices.length} / ${invoices.length}`);
    console.log(`payments (all / in ledger): ${allPayments.length} / ${payments.length}`);
    console.log('');

    console.log('--- Contracts ---');
    for (const c of contracts) {
      console.log(
        `  ${c.contract_id} | provider=${c.provider} client=${c.client} | seq=${c.created_event_seq}`,
      );
    }

    console.log('\n--- Invoices (in ledger) ---');
    for (const inv of invoices) {
      const excluded = startedSeq !== null && inv.created_event_seq < startedSeq ? ' [PRE-LEDGER]' : '';
      console.log(
        `  ${inv.invoice_id.slice(0, 8)}… | ${inv.debtor} → ${inv.creditor} | $${inv.amount_usd}` +
          (inv.final_amount_usd != null ? ` final=$${inv.final_amount_usd}` : '') +
          ` | state=${inv.state} | seq=${inv.created_event_seq}${excluded}`,
      );
    }

    console.log('\n--- Payments (in ledger) ---');
    for (const pay of payments) {
      console.log(
        `  ${pay.payment_id.slice(0, 8)}… | ${pay.payer} → ${pay.receiver} | $${pay.amount_usd}` +
          ` | state=${pay.state} | seq=${pay.created_event_seq}`,
      );
    }

    console.log('\n--- Balance buckets (API) ---');
    for (const [name, bucket] of [
      ['confirmed', balance.confirmed],
      ['pending', balance.pending],
      ['disputed', balance.disputed],
    ] as const) {
      console.log(
        `  ${name}: owesAtoB=${bucket.owesAtoB} owesBtoA=${bucket.owesBtoA} netUsd=${bucket.netUsd}`,
      );
    }

    console.log('\n--- UI labels (DirectionalUsd logic) ---');
    for (const viewer of [accountA, accountB]) {
      const confirmed = directionalForViewer(viewer, accountA, accountB, balance.confirmed);
      const pending = directionalForViewer(viewer, accountA, accountB, balance.pending);
      console.log(`  viewer=${viewer}:`);
      console.log(`    confirmed: ${confirmed.label} (viewerOwes=${confirmed.viewerOwes}, owesViewer=${confirmed.owesViewer})`);
      console.log(`    pending:   ${pending.label} (netUsd=${balance.pending.netUsd})`);
    }

    // Also hit query-api if available
    try {
      const url = `http://localhost:${process.env.QUERY_API_PORT ?? '3000'}/query/v1/obl/ledger?accountA=${accountA}&accountB=${accountB}`;
      const res = await fetch(url);
      if (res.ok) {
        const body = (await res.json()) as { balance: typeof balance; startedEventSeq: string | null };
        console.log('\n--- query-api response (balance only) ---');
        console.log(JSON.stringify(body.balance, null, 2));
        console.log(`startedEventSeq: ${body.startedEventSeq}`);
      } else {
        console.log(`\n(query-api not ok: ${res.status})`);
      }
    } catch {
      console.log('\n(query-api not reachable)');
    }
  } finally {
    await db.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

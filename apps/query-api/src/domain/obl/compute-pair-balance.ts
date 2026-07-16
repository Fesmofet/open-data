export type BalanceInvoiceRow = {
  debtor: string;
  creditor: string;
  amount_usd: string;
  final_amount_usd: string | null;
  state: 'confirmed' | 'pending' | 'disputed' | 'resolved' | 'void';
};

export type BalancePaymentRow = {
  payer: string;
  receiver: string;
  amount_usd: string;
  state: 'confirmed' | 'pending';
};

export type DirectionalUsd = {
  owesAtoB: string;
  owesBtoA: string;
  netUsd: string;
};

export type PairBalanceResult = {
  accountA: string;
  accountB: string;
  confirmed: DirectionalUsd;
  pending: DirectionalUsd;
  disputed: DirectionalUsd;
};

function toAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatUsd(value: number): string {
  return value.toFixed(8);
}

function invoiceAmount(row: BalanceInvoiceRow): number {
  if (row.state === 'resolved' && row.final_amount_usd !== null) {
    return toAmount(row.final_amount_usd);
  }
  return toAmount(row.amount_usd);
}

function directionalForBucket(
  accountA: string,
  accountB: string,
  invoices: readonly BalanceInvoiceRow[],
  payments: readonly BalancePaymentRow[],
): DirectionalUsd {
  let owesAtoB = 0;
  let owesBtoA = 0;

  for (const inv of invoices) {
    if (inv.debtor === accountA && inv.creditor === accountB) {
      owesAtoB += invoiceAmount(inv);
    } else if (inv.debtor === accountB && inv.creditor === accountA) {
      owesBtoA += invoiceAmount(inv);
    }
  }

  for (const pay of payments) {
    if (pay.payer === accountA && pay.receiver === accountB) {
      owesAtoB -= toAmount(pay.amount_usd);
    } else if (pay.payer === accountB && pay.receiver === accountA) {
      owesBtoA -= toAmount(pay.amount_usd);
    }
  }

  const net = owesBtoA - owesAtoB;
  return {
    owesAtoB: formatUsd(Math.max(0, owesAtoB)),
    owesBtoA: formatUsd(Math.max(0, owesBtoA)),
    netUsd: formatUsd(net),
  };
}

export function computePairBalance(
  accountA: string,
  accountB: string,
  invoices: readonly BalanceInvoiceRow[],
  payments: readonly BalancePaymentRow[],
): PairBalanceResult {
  const confirmedInvoices = invoices.filter(
    (row) => row.state === 'confirmed' || row.state === 'resolved',
  );
  const pendingInvoices = invoices.filter((row) => row.state === 'pending');
  const disputedInvoices = invoices.filter((row) => row.state === 'disputed');

  const confirmedPayments = payments.filter((row) => row.state === 'confirmed');
  const pendingPayments = payments.filter((row) => row.state === 'pending');

  return {
    accountA,
    accountB,
    confirmed: directionalForBucket(
      accountA,
      accountB,
      confirmedInvoices,
      confirmedPayments,
    ),
    pending: directionalForBucket(accountA, accountB, pendingInvoices, pendingPayments),
    disputed: directionalForBucket(accountA, accountB, disputedInvoices, []),
  };
}

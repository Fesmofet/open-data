import type {
  JsonValue,
  OblInvoice,
  OblInvoiceKind,
  OblInvoiceState,
  OblObligationLine,
} from '@opden-data-layer/core';

export type OblInvoiceLineView = {
  invoice_id: string;
  contract_id: string | null;
  service_order_id: string | null;
  report_id: string | null;
  issuer: string;
  debtor: string;
  kind: OblInvoiceKind;
  details: JsonValue;
  created_event_seq: bigint;
  transaction_id: string;
  created_at: OblInvoice['created_at'];
  line_id: string;
  creditor: string;
  beneficiary: string;
  amount_usd: string;
  final_amount_usd: string | null;
  state: OblInvoiceState;
  role: string | null;
  dispute_group: string;
  pair_low: string;
  pair_high: string;
};

export type OblInvoiceWithLines = {
  header: OblInvoice;
  lines: OblObligationLine[];
};

export function mapInvoiceLineJoin(row: {
  invoice_id: string;
  contract_id: string | null;
  service_order_id: string | null;
  report_id: string | null;
  issuer: string;
  debtor: string;
  kind: OblInvoiceKind;
  details: JsonValue;
  created_event_seq: bigint;
  transaction_id: string;
  created_at: OblInvoice['created_at'];
  line_id: string;
  beneficiary: string;
  amount_usd: string | number;
  final_amount_usd: string | number | null;
  state: OblInvoiceState;
  role: string | null;
  dispute_group: string;
  pair_low: string;
  pair_high: string;
}): OblInvoiceLineView {
  return {
    invoice_id: row.invoice_id,
    contract_id: row.contract_id,
    service_order_id: row.service_order_id,
    report_id: row.report_id,
    issuer: row.issuer,
    debtor: row.debtor,
    kind: row.kind,
    details: row.details,
    created_event_seq: row.created_event_seq,
    transaction_id: row.transaction_id,
    created_at: row.created_at,
    line_id: row.line_id,
    creditor: row.beneficiary,
    beneficiary: row.beneficiary,
    amount_usd: String(row.amount_usd),
    final_amount_usd:
      row.final_amount_usd !== null && row.final_amount_usd !== undefined
        ? String(row.final_amount_usd)
        : null,
    state: row.state,
    role: row.role,
    dispute_group: row.dispute_group,
    pair_low: row.pair_low,
    pair_high: row.pair_high,
  };
}

export function toBalanceInvoiceRow(line: OblInvoiceLineView) {
  return {
    debtor: line.debtor,
    creditor: line.creditor,
    amount_usd: line.amount_usd,
    final_amount_usd: line.final_amount_usd,
    state: line.state,
  };
}

export function aggregateInvoiceLineView(
  header: OblInvoice,
  lines: readonly OblObligationLine[],
): OblInvoiceLineView | null {
  if (lines.length === 0) {
    return null;
  }
  const first = lines[0];
  if (lines.length === 1) {
    return mapInvoiceLineJoin({
      ...header,
      line_id: first.line_id,
      beneficiary: first.beneficiary,
      amount_usd: first.amount_usd,
      final_amount_usd: first.final_amount_usd,
      state: first.state,
      role: first.role,
      dispute_group: first.dispute_group,
      pair_low: first.pair_low,
      pair_high: first.pair_high,
    });
  }
  const total = lines.reduce((sum, line) => sum + Number(line.amount_usd), 0);
  const state = lines[0].state;
  return mapInvoiceLineJoin({
    ...header,
    line_id: first.line_id,
    beneficiary: first.beneficiary,
    amount_usd: total.toFixed(8),
    final_amount_usd: null,
    state,
    role: null,
    dispute_group: first.dispute_group,
    pair_low: first.pair_low,
    pair_high: first.pair_high,
  });
}

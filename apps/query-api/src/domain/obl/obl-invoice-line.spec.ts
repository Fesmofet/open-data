import type { OblInvoice, OblObligationLine } from '@opden-data-layer/core';
import { aggregateInvoiceLineView } from './obl-invoice-line';

const header: OblInvoice = {
  invoice_id: 'inv-1',
  contract_id: 'c-1',
  service_order_id: null,
  report_id: null,
  issuer: 'alice',
  debtor: 'bob',
  kind: 'single',
  details: {},
  created_event_seq: BigInt(10),
  transaction_id: 'tx-inv',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
};

function line(overrides: Partial<OblObligationLine> = {}): OblObligationLine {
  return {
    line_id: 'inv-1:0',
    invoice_id: 'inv-1',
    debtor: 'bob',
    beneficiary: 'alice',
    amount_usd: '10.00000000',
    final_amount_usd: null,
    state: 'confirmed',
    dispute_group: 'inv-1',
    role: null,
    pair_low: 'alice',
    pair_high: 'bob',
    created_event_seq: BigInt(10),
    transaction_id: 'tx-inv',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('aggregateInvoiceLineView', () => {
  it('returns null when no lines', () => {
    expect(aggregateInvoiceLineView(header, [])).toBeNull();
  });

  it('maps single line fields', () => {
    const view = aggregateInvoiceLineView(header, [line()]);
    expect(view).toMatchObject({
      invoice_id: 'inv-1',
      creditor: 'alice',
      beneficiary: 'alice',
      amount_usd: '10.00000000',
      state: 'confirmed',
    });
  });

  it('aggregates multi-line invoice to total amount', () => {
    const view = aggregateInvoiceLineView(header, [
      line({ line_id: 'inv-1:0', beneficiary: 'winner', amount_usd: '5.00000000' }),
      line({
        line_id: 'inv-1:1',
        beneficiary: 'referral',
        amount_usd: '1.00000000',
        role: 'referral_fee',
      }),
    ]);
    expect(view).toMatchObject({
      amount_usd: '6.00000000',
      beneficiary: 'winner',
      final_amount_usd: null,
      role: null,
    });
  });
});

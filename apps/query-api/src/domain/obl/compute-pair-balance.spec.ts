import { computePairBalance, type BalanceInvoiceRow, type BalancePaymentRow } from './compute-pair-balance';

describe('computePairBalance', () => {
  const alice = 'alice';
  const bob = 'bob';

  it('nets confirmed invoices minus payments (B owes A when net>0)', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: bob,
        creditor: alice,
        amount_usd: '100.00000000',
        final_amount_usd: null,
        state: 'confirmed',
      },
    ];
    const payments: BalancePaymentRow[] = [
      {
        payer: bob,
        receiver: alice,
        amount_usd: '30.00000000',
        state: 'confirmed',
      },
    ];

    const balance = computePairBalance(alice, bob, invoices, payments);
    expect(balance.confirmed.owesBtoA).toBe('70.00000000');
    expect(balance.confirmed.netUsd).toBe('70.00000000');
  });

  it('uses final_amount_usd for resolved invoices in confirmed bucket', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: bob,
        creditor: alice,
        amount_usd: '100.00000000',
        final_amount_usd: '75.00000000',
        state: 'resolved',
      },
    ];

    const balance = computePairBalance(alice, bob, invoices, []);
    expect(balance.confirmed.owesBtoA).toBe('75.00000000');
  });

  it('keeps pending invoices and payments separate from confirmed', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: bob,
        creditor: alice,
        amount_usd: '10.00000000',
        final_amount_usd: null,
        state: 'pending',
      },
    ];
    const payments: BalancePaymentRow[] = [
      {
        payer: bob,
        receiver: alice,
        amount_usd: '4.00000000',
        state: 'pending',
      },
    ];

    const balance = computePairBalance(alice, bob, invoices, payments);
    expect(balance.confirmed.netUsd).toBe('0.00000000');
    expect(balance.pending.netUsd).toBe('6.00000000');
  });

  it('puts payment_declare (pending) only in pending bucket', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: bob,
        creditor: alice,
        amount_usd: '50.00000000',
        final_amount_usd: null,
        state: 'pending',
      },
    ];
    const payments: BalancePaymentRow[] = [
      {
        payer: bob,
        receiver: alice,
        amount_usd: '25.00000000',
        state: 'pending',
      },
    ];

    const balance = computePairBalance(alice, bob, invoices, payments);
    expect(balance.confirmed.netUsd).toBe('0.00000000');
    expect(balance.pending.netUsd).toBe('25.00000000');
    expect(balance.disputed.netUsd).toBe('0.00000000');
  });

  it('puts payment_confirm (confirmed) only in confirmed bucket and reduces owes', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: bob,
        creditor: alice,
        amount_usd: '100.00000000',
        final_amount_usd: null,
        state: 'confirmed',
      },
    ];
    const payments: BalancePaymentRow[] = [
      {
        payer: bob,
        receiver: alice,
        amount_usd: '40.00000000',
        state: 'confirmed',
      },
    ];

    const balance = computePairBalance(alice, bob, invoices, payments);
    expect(balance.confirmed.owesBtoA).toBe('60.00000000');
    expect(balance.pending.netUsd).toBe('0.00000000');
    expect(balance.disputed.netUsd).toBe('0.00000000');
  });

  it('puts disputed invoices only in disputed bucket', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: bob,
        creditor: alice,
        amount_usd: '80.00000000',
        final_amount_usd: null,
        state: 'disputed',
      },
    ];

    const balance = computePairBalance(alice, bob, invoices, []);
    expect(balance.disputed.owesBtoA).toBe('80.00000000');
    expect(balance.disputed.netUsd).toBe('80.00000000');
    expect(balance.confirmed.netUsd).toBe('0.00000000');
    expect(balance.pending.netUsd).toBe('0.00000000');
  });

  it('excludes void invoices from all buckets', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: bob,
        creditor: alice,
        amount_usd: '50.00000000',
        final_amount_usd: null,
        state: 'void',
      },
    ];

    const balance = computePairBalance(alice, bob, invoices, []);
    expect(balance.confirmed.netUsd).toBe('0.00000000');
    expect(balance.pending.netUsd).toBe('0.00000000');
    expect(balance.disputed.netUsd).toBe('0.00000000');
  });

  it('nets beneficiary obligation in cross-party pair', () => {
    const invoices: BalanceInvoiceRow[] = [
      {
        debtor: 'sponsor',
        creditor: 'winnerA',
        amount_usd: '50.00000000',
        final_amount_usd: null,
        state: 'confirmed',
      },
    ];

    const balance = computePairBalance('sponsor', 'winnerA', invoices, []);
    expect(balance.confirmed.owesAtoB).toBe('50.00000000');
    expect(balance.confirmed.netUsd).toBe('-50.00000000');
  });
});

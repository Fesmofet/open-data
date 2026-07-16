import {
  buildLedgerPaymentAmountView,
  buildLedgerPaymentDeclaredLabel,
  canConfirmLedgerPayment,
  hasPaymentDeclaredMismatch,
} from './ledger-payment-amount';
import type { LedgerPaymentRow } from './ledger.types';

function payment(overrides: Partial<LedgerPaymentRow> = {}): LedgerPaymentRow {
  return {
    payment_id: 'pay-1',
    payer: 'alice',
    receiver: 'bob',
    amount_usd: '12.5',
    state: 'confirmed',
    method: 'offchain',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildLedgerPaymentAmountView', () => {
  it('marks outgoing payments negative for payer', () => {
    const view = buildLedgerPaymentAmountView('alice', payment());
    expect(view.tone).toBe('negative');
    expect(view.sign).toBe('-');
    expect(view.amount).toBe('12.500');
    expect(view.currency).toBe('USD');
  });

  it('marks incoming payments positive for receiver', () => {
    const view = buildLedgerPaymentAmountView('bob', payment());
    expect(view.tone).toBe('positive');
    expect(view.sign).toBe('+');
  });

  it('uses neutral tone when viewer is neither party', () => {
    const view = buildLedgerPaymentAmountView('carol', payment());
    expect(view.tone).toBe('neutral');
    expect(view.sign).toBe('none');
  });

  it('formats fractional amounts with wallet history rules', () => {
    const view = buildLedgerPaymentAmountView(
      'alice',
      payment({ amount_usd: '0.00026163' }),
    );
    expect(view.amount).toBe('0.00026');
  });
});

describe('hasPaymentDeclaredMismatch', () => {
  it('returns true when declared differs from settled amount', () => {
    expect(
      hasPaymentDeclaredMismatch(
        payment({ amount_usd: '40', declared_amount_usd: '60' }),
      ),
    ).toBe(true);
  });

  it('returns false when declared matches settled amount', () => {
    expect(
      hasPaymentDeclaredMismatch(
        payment({ amount_usd: '60', declared_amount_usd: '60' }),
      ),
    ).toBe(false);
  });

  it('falls back to amount_usd when declared is missing', () => {
    expect(hasPaymentDeclaredMismatch(payment({ amount_usd: '12.5' }))).toBe(false);
  });
});

describe('buildLedgerPaymentDeclaredLabel', () => {
  it('formats declared amount with currency', () => {
    expect(
      buildLedgerPaymentDeclaredLabel(
        payment({ declared_amount_usd: '60', amount_usd: '40' }),
      ),
    ).toBe('60 USD');
  });
});

describe('canConfirmLedgerPayment', () => {
  it('allows receiver to confirm pending offchain declare', () => {
    expect(
      canConfirmLedgerPayment(
        payment({ state: 'pending', receiver: 'bob', method: 'offchain' }),
        'bob',
      ),
    ).toBe(true);
  });

  it('rejects confirmed or non-offchain payments', () => {
    expect(canConfirmLedgerPayment(payment({ state: 'confirmed' }), 'bob')).toBe(false);
    expect(
      canConfirmLedgerPayment(payment({ state: 'pending', method: 'onchain' }), 'bob'),
    ).toBe(false);
  });
});

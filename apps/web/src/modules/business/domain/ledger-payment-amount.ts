import { formatWalletHistoryQuantity } from '@/modules/user-wallet/domain/waiv-wallet-history-amount-format';

import type { LedgerPaymentRow } from './ledger.types';

export type LedgerPaymentAmountView = {
  amount: string;
  currency: 'USD';
  tone: 'positive' | 'negative' | 'neutral';
  sign: '+' | '-' | 'none';
};

function paymentDeclaredAmount(payment: LedgerPaymentRow): string {
  return payment.declared_amount_usd ?? payment.amount_usd;
}

export function hasPaymentDeclaredMismatch(payment: LedgerPaymentRow): boolean {
  const declared = paymentDeclaredAmount(payment);
  const settled = payment.amount_usd;
  const declaredNum = Number.parseFloat(declared);
  const settledNum = Number.parseFloat(settled);
  if (!Number.isFinite(declaredNum) || !Number.isFinite(settledNum)) {
    return declared !== settled;
  }
  return declaredNum !== settledNum;
}

export function buildLedgerPaymentDeclaredLabel(payment: LedgerPaymentRow): string {
  const amount = formatWalletHistoryQuantity(paymentDeclaredAmount(payment));
  return `${amount} USD`;
}

export function buildLedgerPaymentAmountView(
  viewer: string,
  payment: LedgerPaymentRow,
): LedgerPaymentAmountView {
  const amount = formatWalletHistoryQuantity(payment.amount_usd);
  const base = { amount, currency: 'USD' as const };

  if (payment.payer === viewer) {
    return { ...base, tone: 'negative', sign: '-' };
  }
  if (payment.receiver === viewer) {
    return { ...base, tone: 'positive', sign: '+' };
  }
  return { ...base, tone: 'neutral', sign: 'none' };
}

export function canConfirmLedgerPayment(
  pay: LedgerPaymentRow,
  username: string,
): boolean {
  return pay.state === 'pending' && pay.receiver === username && pay.method === 'offchain';
}

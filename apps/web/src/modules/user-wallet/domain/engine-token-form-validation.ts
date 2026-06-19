import {
  isEngineTokenAmountWithinMax,
  parseEngineTokenAmount,
} from './engine-token-amount';

export type EngineTokenFormValidationCode =
  | 'recipient_required'
  | 'amount_invalid'
  | 'amount_exceeds_max';

export function validateEngineTokenRecipient(to: string): EngineTokenFormValidationCode | null {
  if (to.trim().length < 3) {
    return 'recipient_required';
  }
  return null;
}

export function validateEngineTokenAmount(
  amount: string,
  maxAmount: string,
): EngineTokenFormValidationCode | null {
  const parsed = parseEngineTokenAmount(amount);
  if (parsed === null) {
    return 'amount_invalid';
  }
  if (!isEngineTokenAmountWithinMax(amount, maxAmount)) {
    return 'amount_exceeds_max';
  }
  return null;
}

export function engineTokenFormValidationMessageKey(
  code: EngineTokenFormValidationCode,
): string {
  switch (code) {
    case 'recipient_required':
      return 'wallet_validation_recipient_required';
    case 'amount_invalid':
      return 'wallet_validation_amount_invalid';
    case 'amount_exceeds_max':
      return 'wallet_validation_amount_exceeds_max';
  }
}

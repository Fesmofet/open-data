import {
  validateEngineTokenAmount,
  validateEngineTokenRecipient,
} from './engine-token-form-validation';

describe('validateEngineTokenRecipient', () => {
  it('requires at least three characters', () => {
    expect(validateEngineTokenRecipient('ab')).toBe('recipient_required');
    expect(validateEngineTokenRecipient('alice')).toBeNull();
  });
});

describe('validateEngineTokenAmount', () => {
  it('rejects invalid and over-max amounts', () => {
    expect(validateEngineTokenAmount('0', '1')).toBe('amount_invalid');
    expect(validateEngineTokenAmount('2', '1')).toBe('amount_exceeds_max');
    expect(validateEngineTokenAmount('0.5', '1')).toBeNull();
  });
});

import {
  isEngineTokenAmountWithinMax,
  parseEngineTokenAmount,
} from './engine-token-amount';
import {
  mapEngineTokenBroadcastError,
  isHiveSignerRedirectError,
} from './engine-token-broadcast-errors';
import { HIVESIGNER_REDIRECT_INITIATED } from '@/modules/auth/infrastructure/signers/hivesigner-signer';

describe('parseEngineTokenAmount', () => {
  it('parses positive Hive Engine quantity strings', () => {
    expect(parseEngineTokenAmount('0.1')).toBe(0.1);
    expect(parseEngineTokenAmount('1')).toBe(1);
  });

  it('rejects zero, empty, and invalid strings', () => {
    expect(parseEngineTokenAmount('0')).toBeNull();
    expect(parseEngineTokenAmount('')).toBeNull();
    expect(parseEngineTokenAmount('abc')).toBeNull();
  });
});

describe('isEngineTokenAmountWithinMax', () => {
  it('compares amount against max balance string', () => {
    expect(isEngineTokenAmountWithinMax('0.1', '1')).toBe(true);
    expect(isEngineTokenAmountWithinMax('2', '1')).toBe(false);
  });
});

describe('mapEngineTokenBroadcastError', () => {
  it('maps known wallet errors to codes', () => {
    expect(mapEngineTokenBroadcastError(new Error('Not logged in'))).toBe(
      'not_logged_in',
    );
  });

  it('detects HiveSigner redirect sentinel', () => {
    expect(
      isHiveSignerRedirectError(new Error(HIVESIGNER_REDIRECT_INITIATED)),
    ).toBe(true);
  });
});

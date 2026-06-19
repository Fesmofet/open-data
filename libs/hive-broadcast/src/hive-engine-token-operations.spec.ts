import { HIVE_ENGINE_CUSTOM_JSON_ID } from './constants';
import { buildHiveEngineTokensOp } from './hive-engine-token-operations';

describe('buildHiveEngineTokensOp', () => {
  it('builds stake op with default to=self', () => {
    const op = buildHiveEngineTokensOp({
      account: 'alice',
      contractAction: 'stake',
      payload: { symbol: 'WAIV', quantity: '1.000' },
    });
    expect(op.id).toBe(HIVE_ENGINE_CUSTOM_JSON_ID);
    expect(op.required_auths).toEqual(['alice']);
    expect(op.required_posting_auths).toEqual([]);
    expect(JSON.parse(op.json)).toEqual({
      contractName: 'tokens',
      contractAction: 'stake',
      contractPayload: { to: 'alice', symbol: 'WAIV', quantity: '1.000' },
    });
  });

  it('builds transfer op with memo', () => {
    const op = buildHiveEngineTokensOp({
      account: 'alice',
      contractAction: 'transfer',
      payload: {
        symbol: 'WAIV',
        quantity: '0.500',
        to: 'bob',
        memo: 'hi',
      },
    });
    expect(JSON.parse(op.json)).toEqual({
      contractName: 'tokens',
      contractAction: 'transfer',
      contractPayload: {
        symbol: 'WAIV',
        quantity: '0.500',
        to: 'bob',
        memo: 'hi',
      },
    });
  });

  it('builds delegate op', () => {
    const op = buildHiveEngineTokensOp({
      account: 'alice',
      contractAction: 'delegate',
      payload: { symbol: 'WAIV', quantity: '2.000', to: 'bob' },
    });
    expect(JSON.parse(op.json).contractAction).toBe('delegate');
  });

  it('builds unstake and cancelUnstake ops', () => {
    const unstake = buildHiveEngineTokensOp({
      account: 'alice',
      contractAction: 'unstake',
      payload: { symbol: 'WAIV', quantity: '1.000' },
    });
    expect(JSON.parse(unstake.json).contractAction).toBe('unstake');

    const cancel = buildHiveEngineTokensOp({
      account: 'alice',
      contractAction: 'cancelUnstake',
      payload: { symbol: 'WAIV' },
    });
    expect(JSON.parse(cancel.json)).toEqual({
      contractName: 'tokens',
      contractAction: 'cancelUnstake',
      contractPayload: { symbol: 'WAIV' },
    });
  });
});

import { buildWalletMessage } from './wallet';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('buildWalletMessage', () => {
  it('maps change_recovery_account to account_to_recover param', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'change_recovery_account',
      payload: {
        account: 'alice',
        newRecoveryAccount: 'recovery',
      },
    });
    expect(msg?.key).toBe('change_recovery_account');
    expect(msg?.params).toEqual({
      account_to_recover: 'alice',
      new_recovery_account: 'recovery',
    });
  });

  it('maps transfer_in to recipient account param', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'transfer_in',
      actor: 'wiv01',
      payload: {
        from: 'wiv01',
        to: 'flowmaster',
        amount: '0.001',
        symbol: 'WAIV',
        memo: null,
      },
    });
    expect(msg?.params).toEqual({
      username: 'wiv01',
      amount: '0.001 WAIV',
      to: 'flowmaster',
    });
  });
});

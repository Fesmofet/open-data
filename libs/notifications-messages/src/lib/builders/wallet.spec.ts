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

  it('maps hive power_up to actor-initiated copy', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'power_up',
      actor: 'wiv01',
      payload: {
        from: 'wiv01',
        to: 'wiv01',
        amount: '0.001',
      },
    });
    expect(msg?.key).toBe('power_up_initiated_actor');
    expect(msg?.params).toEqual({
      from: 'wiv01',
      amount: '0.001',
      to: 'wiv01',
    });
  });

  it('maps hive power_down with VESTS amount', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'power_down',
      actor: 'wiv01',
      payload: {
        account: 'wiv01',
        amount: '1.616380 VESTS',
      },
    });
    expect(msg?.key).toBe('power_down_notification');
    expect(msg?.params).toEqual({
      username: 'wiv01',
      amount: '1.616380 VESTS',
    });
  });

  it('maps engine_stake to transfer_to_vesting', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'engine_stake',
      actor: 'wiv01',
      payload: {
        from: 'wiv01',
        to: 'wiv01',
        amount: '0.001',
        symbol: 'WAIV',
      },
    });
    expect(msg?.key).toBe('transfer_to_vesting');
    expect(msg?.params).toEqual({
      from: 'wiv01',
      to: 'wiv01',
      amount: '0.001 WAIV',
    });
  });

  it('maps engine_unstake to power down copy', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'engine_unstake',
      actor: 'wiv01',
      payload: {
        account: 'wiv01',
        amount: '0.001',
        symbol: 'WAIV',
      },
    });
    expect(msg?.key).toBe('notification_engine_power_down');
    expect(msg?.params).toEqual({
      from: 'wiv01',
      amount: '0.001 WAIV',
    });
  });

  it('maps hp_delegation undelegation when amount is zero', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'hp_delegation',
      actor: 'wiv01',
      payload: {
        delegator: 'wiv01',
        delegatee: 'flowmaster',
        amount: '0',
      },
    });
    expect(msg?.key).toBe('notification_hp_undelegation');
    expect(msg?.params).toEqual({
      delegator: 'wiv01',
      delegatee: 'flowmaster',
      amount: '0',
    });
  });

  it('maps hp_delegation with VESTS amount', () => {
    const msg = buildWalletMessage({
      ...baseEnvelope,
      type: 'hp_delegation',
      actor: 'wiv01',
      payload: {
        delegator: 'wiv01',
        delegatee: 'flowmaster',
        amount: '1616.379872 VESTS',
      },
    });
    expect(msg?.key).toBe('notification_hp_delegation');
    expect(msg?.params).toEqual({
      delegator: 'wiv01',
      delegatee: 'flowmaster',
      amount: '1616.379872 VESTS',
    });
  });
});

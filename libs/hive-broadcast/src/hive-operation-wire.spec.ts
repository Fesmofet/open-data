import { buildAccountUpdateAuthorityOp } from './hive-account-authority-operations';
import { buildDelegateVestingSharesOp } from './hive-l1-wallet-operations';
import { toHiveWireOperation, toHiveWireOperations } from './hive-operation-wire';

describe('hive-operation-wire', () => {
  it('converts delegate_vesting_shares to wire tuple', () => {
    const op = buildDelegateVestingSharesOp({
      delegator: 'alice',
      delegatee: 'bob',
      vestingShares: '1.000000 VESTS',
    });

    expect(toHiveWireOperation(op)).toEqual([
      'delegate_vesting_shares',
      {
        delegator: 'alice',
        delegatee: 'bob',
        vesting_shares: '1.000000 VESTS',
      },
    ]);
  });

  it('maps multiple operations', () => {
    const ops = [
      buildDelegateVestingSharesOp({
        delegator: 'a',
        delegatee: 'b',
        vestingShares: '2.000000 VESTS',
      }),
    ];

    expect(toHiveWireOperations(ops)).toHaveLength(1);
    expect(toHiveWireOperations(ops)[0]?.[0]).toBe('delegate_vesting_shares');
  });

  it('converts account_update to wire tuple', () => {
    const op = buildAccountUpdateAuthorityOp({
      account: 'alice',
      authorityType: 'active',
      authority: {
        weight_threshold: 1,
        account_auths: [['bob', 1]],
        key_auths: [['STM5CSuEihKVibpeJ9ruxhQyzfYiDX1FrMh4fuDR2M2hbwTGqX9oA', 1]],
      },
      memoKey: 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
      jsonMetadata: '{}',
    });

    expect(toHiveWireOperation(op)).toEqual([
      'account_update',
      {
        account: 'alice',
        memo_key: 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
        json_metadata: '{}',
        active: {
          weight_threshold: 1,
          account_auths: [['bob', 1]],
          key_auths: [['STM5CSuEihKVibpeJ9ruxhQyzfYiDX1FrMh4fuDR2M2hbwTGqX9oA', 1]],
        },
      },
    ]);
  });
});

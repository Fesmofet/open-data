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
});

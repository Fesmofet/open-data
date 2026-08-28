import {
  buildClaimRewardBalanceOp,
  buildCollateralizedConvertOp,
  buildDelegateRcOp,
  buildTransferOp,
  formatHiveAssetAmount,
  toHiveUint32RequestId,
} from './hive-l1-wallet-operations';
import { toHiveWireOperation } from './hive-operation-wire';

describe('hive-l1-wallet-operations', () => {
  it('formats hive asset amounts', () => {
    expect(formatHiveAssetAmount(1.5, 'HIVE')).toBe('1.500 HIVE');
    expect(formatHiveAssetAmount(0.014, 'HBD')).toBe('0.014 HBD');
  });

  it('builds transfer op', () => {
    expect(
      buildTransferOp({
        from: 'alice',
        to: 'bob',
        amount: '1.000 HIVE',
        memo: 'hi',
      }),
    ).toEqual({
      type: 'transfer',
      from: 'alice',
      to: 'bob',
      amount: '1.000 HIVE',
      memo: 'hi',
    });
  });

  it('wraps requestid to uint32', () => {
    expect(toHiveUint32RequestId(4_294_967_296)).toBe(0);
    expect(toHiveUint32RequestId(1_787_916_172_475)).toBe(1_209_777_339);
  });

  it('builds collateralized convert op with 3-decimal HIVE amount', () => {
    const requestid = 1_700_000_000;
    const op = buildCollateralizedConvertOp({
      owner: 'alice',
      requestid,
      amount: 1.2,
    });
    expect(op).toEqual({
      type: 'collateralized_convert',
      owner: 'alice',
      requestid,
      amount: '1.200 HIVE',
    });
    expect(toHiveWireOperation(op)).toEqual([
      'collateralized_convert',
      {
        owner: 'alice',
        requestid,
        amount: '1.200 HIVE',
      },
    ]);
  });

  it('builds claim reward balance op', () => {
    expect(
      buildClaimRewardBalanceOp({
        account: 'alice',
        rewardHive: '0.734 HIVE',
        rewardHbd: '0.012 HBD',
        rewardVests: '123.456789 VESTS',
      }),
    ).toEqual({
      type: 'claim_reward_balance',
      account: 'alice',
      reward_hive: '0.734 HIVE',
      reward_hbd: '0.012 HBD',
      reward_vests: '123.456789 VESTS',
    });
  });

  it('builds delegate_rc with peakd-compatible payload', () => {
    const op = buildDelegateRcOp({
      from: 'flowmaster',
      delegatees: ['wiv01'],
      maxRc: 111_000_000_000,
    });

    expect(op.type).toBe('custom_json');
    expect(op.id).toBe('rc');
    expect(op.required_auths).toEqual([]);
    expect(op.required_posting_auths).toEqual(['flowmaster']);
    expect(JSON.parse(op.json)).toEqual([
      'delegate_rc',
      {
        from: 'flowmaster',
        delegatees: ['wiv01'],
        max_rc: 111_000_000_000,
      },
    ]);
  });

  it('builds delegate_rc removal with max_rc zero', () => {
    const op = buildDelegateRcOp({
      from: 'alice',
      delegatees: ['bob'],
      maxRc: 0,
    });

    expect(JSON.parse(op.json)).toEqual([
      'delegate_rc',
      { from: 'alice', delegatees: ['bob'], max_rc: 0 },
    ]);
  });
});

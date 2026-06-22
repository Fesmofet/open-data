import {
  buildTransferOp,
  formatHiveAssetAmount,
} from './hive-l1-wallet-operations';

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
});

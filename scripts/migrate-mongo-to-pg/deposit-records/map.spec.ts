import { CREATE_DEPOSIT_RECORD_OPERATION, mongoDepositRecordToRow } from './map';

describe('mongoDepositRecordToRow', () => {
  it('maps legacy createDepositRecord document', () => {
    const row = mongoDepositRecordToRow({
      operation: CREATE_DEPOSIT_RECORD_OPERATION,
      account: 'alice',
      transactionId: 'tx1',
      refHiveBlockNumber: 100,
      timestamp: 1_700_000_000,
      destination: 'alice',
      symbolIn: 'HIVE',
      symbolOut: 'SWAP.HIVE',
      pair: 'HIVE -> SWAP.HIVE',
      ex_rate: 0.99,
      depositAccount: 'honey-swap',
      memo: '{"id":"ssc-mainnet-hive"}',
    });
    expect(row).toMatchObject({
      account: 'alice',
      symbol_in: 'HIVE',
      deposit_account: 'honey-swap',
      ex_rate: 0.99,
    });
  });

  it('rejects when both deposit account and address are set', () => {
    expect(
      mongoDepositRecordToRow({
        account: 'alice',
        transactionId: 'tx1',
        refHiveBlockNumber: 1,
        timestamp: 1,
        destination: 'alice',
        symbolIn: 'BTC',
        symbolOut: 'SWAP.BTC',
        pair: 'p',
        ex_rate: 1,
        depositAccount: 'a',
        address: '0xabc',
      }),
    ).toBeNull();
  });
});

import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import { HiveEngineDepositHandler } from './hive-engine-deposit.handler';
import type { HiveEngineDepositRecordsRepository } from '../../../repositories/hive-engine-deposit-records.repository';

describe('HiveEngineDepositHandler', () => {
  const baseCtx = {
    action: 'hive_engine_deposit',
    creator: 'alice',
    blockNum: 90_000_000,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'abc123',
    timestamp: '2024-01-15T12:00:00.000Z',
    eventSeq: BigInt(1),
    eventIdIndexMap: new Map<string, number>(),
  };

  it('inserts deposit record when payload is valid', async () => {
    const insertRecord = jest.fn().mockResolvedValue(undefined);
    const repo = { insertRecord } as unknown as HiveEngineDepositRecordsRepository;
    const handler = new HiveEngineDepositHandler(repo);

    await handler.handle(
      {
        author: 'alice',
        destination: 'alice',
        symbol_in: 'HIVE',
        symbol_out: 'SWAP.HIVE',
        pair: 'HIVE -> SWAP.HIVE',
        ex_rate: 0.99,
        deposit_account: 'honey-swap',
        memo: 'memo',
      },
      baseCtx,
    );

    expect(insertRecord).toHaveBeenCalledWith({
      account: 'alice',
      transaction_id: 'abc123',
      ref_hive_block_number: 90_000_000,
      block_timestamp: hiveBlockTimestampToDate(baseCtx.timestamp),
      destination: 'alice',
      symbol_in: 'HIVE',
      symbol_out: 'SWAP.HIVE',
      pair: 'HIVE -> SWAP.HIVE',
      ex_rate: 0.99,
      deposit_account: 'honey-swap',
      address: null,
      memo: 'memo',
    });
  });

  it('skips when author does not match creator', async () => {
    const insertRecord = jest.fn();
    const handler = new HiveEngineDepositHandler({
      insertRecord,
    } as unknown as HiveEngineDepositRecordsRepository);

    await handler.handle(
      {
        author: 'bob',
        destination: 'alice',
        symbol_in: 'HIVE',
        symbol_out: 'SWAP.HIVE',
        pair: 'p',
        ex_rate: 1,
        deposit_account: 'honey-swap',
      },
      baseCtx,
    );

    expect(insertRecord).not.toHaveBeenCalled();
  });
});

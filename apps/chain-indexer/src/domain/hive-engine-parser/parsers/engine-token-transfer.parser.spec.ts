import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import { EngineTokenTransferParser } from './engine-token-transfer.parser';

function tx(
  partial: Partial<HiveEngineTransaction> & Pick<HiveEngineTransaction, 'contract' | 'action'>,
): HiveEngineTransaction {
  return {
    refHiveBlockNumber: 72281607,
    transactionId: 'he-abc',
    sender: 'alice',
    payload: '{}',
    executedCodeHash: '',
    hash: '',
    databaseHash: '',
    logs: '{}',
    ...partial,
  };
}

const blockBase = {
  blockNumber: 25283481,
  refHiveBlockNumber: 72281607,
  timestamp: '2024-01-01T00:00:00',
  virtualTransactions: [],
} as unknown as HiveEngineBlock;

describe('EngineTokenTransferParser', () => {
  let notifyEmit: jest.Mock;
  let parser: EngineTokenTransferParser;

  beforeEach(() => {
    notifyEmit = jest.fn();
    parser = new EngineTokenTransferParser({ emit: notifyEmit } as never);
  });

  it('emits engine_transfer and engine_transfer_out for non-WAIV tokens/transfer', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'tokens',
          action: 'transfer',
          sender: 'alice',
          transactionId: 'he-bee-1',
          payload: JSON.stringify({ to: 'bob', memo: 'hi' }),
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'BEE', quantity: '1.50000000' },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).toHaveBeenCalledTimes(2);
    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_transfer',
        actor: 'alice',
        trxId: 'he-bee-1',
        blockNum: 72281607,
        payload: {
          from: 'alice',
          to: 'bob',
          amount: '1.50000000',
          symbol: 'BEE',
          memo: 'hi',
        },
      }),
    );
    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_transfer_out',
        actor: 'alice',
        trxId: 'he-bee-1',
        payload: {
          from: 'alice',
          to: 'bob',
          amount: '1.50000000',
          symbol: 'BEE',
          memo: 'hi',
        },
      }),
    );
  });

  it('emits both directions for WAIV tokens/transfer', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'tokens',
          action: 'transfer',
          sender: 'alice',
          payload: JSON.stringify({ to: 'bob' }),
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'WAIV', quantity: '2.00000000' },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).toHaveBeenCalledTimes(2);
    expect(notifyEmit.mock.calls.map((c) => c[0].type)).toEqual([
      'engine_transfer',
      'engine_transfer_out',
    ]);
  });

  it('emits inbound only for hivepegged/buy transfer log', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'hivepegged',
          action: 'buy',
          sender: 'hive-engine',
          payload: '{}',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: {
                  to: 'bob',
                  symbol: 'SWAP.HIVE',
                  quantity: '10.00000000',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).toHaveBeenCalledTimes(1);
    expect(notifyEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engine_transfer',
        actor: 'hive-engine',
        payload: {
          from: 'hive-engine',
          to: 'bob',
          amount: '10.00000000',
          symbol: 'SWAP.HIVE',
          memo: null,
        },
      }),
    );
  });

  it('emits inbound only for hivepegged/buy issue log', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'hivepegged',
          action: 'buy',
          sender: 'hive-engine',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'issue',
                data: {
                  to: 'bob',
                  symbol: 'SWAP.HIVE',
                  quantity: '10.00000000',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).toHaveBeenCalledTimes(1);
    expect(notifyEmit.mock.calls[0][0].type).toBe('engine_transfer');
  });

  it('does not emit for marketpools/swapTokens', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'marketpools',
          action: 'swapTokens',
          sender: 'nervi',
          logs: JSON.stringify({
            events: [
              {
                contract: 'marketpools',
                event: 'swapTokens',
                data: { symbolOut: 'SWAP.HIVE', symbolIn: 'DEC' },
              },
              {
                contract: 'tokens',
                event: 'transferFromContract',
                data: { quantity: '0.25', symbol: 'SWAP.HIVE' },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('skips tokens/transfer when logs.errors is set', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'tokens',
          action: 'transfer',
          payload: JSON.stringify({ to: 'bob' }),
          logs: JSON.stringify({ errors: ['x'], events: [] }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('skips tokens/transfer without transfer log events', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'tokens',
          action: 'transfer',
          payload: JSON.stringify({ to: 'bob', symbol: 'BEE', quantity: '1' }),
          logs: JSON.stringify({ events: [] }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('skips hivepegged/withdraw', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'hivepegged',
          action: 'withdraw',
          sender: 'alice',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'SWAP.HIVE', quantity: '1', to: 'bob' },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('skips market/buy', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'market',
          action: 'buy',
          sender: 'alice',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'BEE', quantity: '1', to: 'bob' },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('skips malformed transfer payload JSON', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [
        tx({
          contract: 'tokens',
          action: 'transfer',
          payload: '{not json',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: { symbol: 'BEE', quantity: '1' },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).not.toHaveBeenCalled();
  });

  it('processes hivepegged/buy from virtualTransactions', async () => {
    await parser.parseBlock({
      ...blockBase,
      transactions: [],
      virtualTransactions: [
        tx({
          contract: 'hivepegged',
          action: 'buy',
          sender: 'hive-engine',
          logs: JSON.stringify({
            events: [
              {
                contract: 'tokens',
                event: 'transfer',
                data: {
                  to: 'bob',
                  symbol: 'SWAP.HIVE',
                  quantity: '10.00000000',
                },
              },
            ],
          }),
        }),
      ],
    } as unknown as HiveEngineBlock);

    expect(notifyEmit).toHaveBeenCalledTimes(1);
    expect(notifyEmit.mock.calls[0][0].payload.to).toBe('bob');
  });
});

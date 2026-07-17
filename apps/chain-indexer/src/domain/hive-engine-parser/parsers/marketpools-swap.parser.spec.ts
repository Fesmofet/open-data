import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import type { HiveEngineSwapsRepository } from '../../../repositories/hive-engine-swaps.repository';
import { MarketpoolsSwapParser } from './marketpools-swap.parser';

function swapTx(logs: object): HiveEngineTransaction {
  return {
    refHiveBlockNumber: 72281607,
    transactionId: '00000055a531397a3f21ce26eeac7edbd6fcb731',
    sender: 'nervi',
    contract: 'marketpools',
    action: 'swapTokens',
    payload: '{}',
    executedCodeHash: '',
    hash: '',
    databaseHash: '',
    logs: JSON.stringify(logs),
  };
}

describe('MarketpoolsSwapParser', () => {
  let insertSwapsBatch: jest.Mock;
  let parser: MarketpoolsSwapParser;

  beforeEach(() => {
    insertSwapsBatch = jest.fn().mockResolvedValue(undefined);
    parser = new MarketpoolsSwapParser({
      insertSwapsBatch,
    } as unknown as HiveEngineSwapsRepository);
  });

  it('persists swap row from marketpools/swapTokens transaction', async () => {
    await parser.parseBlock({
      blockNumber: 25283481,
      timestamp: '2023-02-13T18:39:42.000Z',
      transactions: [
        swapTx({
          events: [
            {
              contract: 'marketpools',
              event: 'swapTokens',
              data: { symbolOut: 'SWAP.HIVE', symbolIn: 'DEC' },
            },
            {
              contract: 'tokens',
              event: 'transferFromContract',
              data: { quantity: '0.25171831', symbol: 'SWAP.HIVE' },
            },
            {
              contract: 'tokens',
              event: 'transferToContract',
              data: { quantity: '148.48', symbol: 'DEC' },
            },
          ],
        }),
      ],
      virtualTransactions: [],
    } as unknown as HiveEngineBlock);

    expect(insertSwapsBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        account: 'nervi',
        transaction_id: '00000055a531397a3f21ce26eeac7edbd6fcb731',
        block_number: 25283481,
        ref_hive_block_number: 72281607,
        symbol_out: 'SWAP.HIVE',
        symbol_in: 'DEC',
        symbol_out_quantity: '0.25171831',
        symbol_in_quantity: '148.48',
      }),
    ]);
  });

  it('skips transactions with logs.errors', async () => {
    await parser.parseBlock({
      blockNumber: 1,
      timestamp: '2023-01-01T00:00:00.000Z',
      transactions: [
        swapTx({ errors: ['x'], events: [] }),
      ],
      virtualTransactions: [],
    } as unknown as HiveEngineBlock);

    expect(insertSwapsBatch).not.toHaveBeenCalled();
  });

  it('ignores non-swap contract transactions', async () => {
    await parser.parseBlock({
      blockNumber: 1,
      timestamp: '2023-01-01T00:00:00.000Z',
      transactions: [
        {
          ...swapTx({ events: [] }),
          contract: 'tokens',
          action: 'transfer',
        },
      ],
      virtualTransactions: [],
    } as unknown as HiveEngineBlock);

    expect(insertSwapsBatch).not.toHaveBeenCalled();
  });
});

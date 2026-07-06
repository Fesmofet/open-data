import { EngineWalletHistoryPagerService } from './engine-wallet-history-pager.service';

describe('EngineWalletHistoryPagerService', () => {
  const historyClient = {
    accountHistoryWithStatus: jest.fn(),
  };
  const swapsRepo = { findByAccount: jest.fn() };

  let pager: EngineWalletHistoryPagerService;

  beforeEach(() => {
    jest.clearAllMocks();
    pager = new EngineWalletHistoryPagerService(
      historyClient as never,
      swapsRepo as never,
    );
    swapsRepo.findByAccount.mockResolvedValue([]);
  });

  it('merges RPC and swap rows newest first', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: false,
      entries: [
        {
          account: 'alice',
          quantity: '1',
          symbol: 'DEC',
          operation: 'tokens_transfer',
          timestamp: 200,
          transactionId: 'a',
        },
        {
          account: 'alice',
          quantity: '2',
          symbol: 'DEC',
          operation: 'tokens_stake',
          timestamp: 100,
          transactionId: 'b',
        },
      ],
    });
    swapsRepo.findByAccount.mockResolvedValue([
      {
        id: BigInt(1),
        account: 'alice',
        transaction_id: 'swap',
        block_number: 1,
        ref_hive_block_number: 1,
        block_timestamp: new Date(150_000),
        symbol_out: 'HIVE',
        symbol_in: 'DEC',
        symbol_out_quantity: '1',
        symbol_in_quantity: '1',
        symbols: ['DEC', 'HIVE'],
        created_at: new Date(150_000),
      },
    ]);

    const result = await pager.collectPage({
      account: 'alice',
      limit: 2,
      cursor: null,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.operation).toBe('tokens_transfer');
    expect(result.items[1]?.operation).toBe('marketpools_swapTokens');
    expect(result.hasMore).toBe(true);
  });

  it('excludes WAIV RPC rows when history API ignores excludeSymbols', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: false,
      entries: [
        {
          account: 'alice',
          quantity: '1',
          symbol: 'WAIV',
          operation: 'tokens_unstakeDone',
          timestamp: 300,
          transactionId: 'waiv-1',
        },
        {
          account: 'alice',
          quantity: '2',
          symbol: 'DEC',
          operation: 'tokens_transfer',
          timestamp: 200,
          transactionId: 'dec-1',
        },
      ],
    });

    const result = await pager.collectPage({
      account: 'alice',
      limit: 5,
      cursor: null,
    });

    expect(result.items.every((item) => item.payload.symbol !== 'WAIV')).toBe(true);
    expect(result.items[0]?.payload.symbol).toBe('DEC');
  });

  it('includes WAIV pool swaps from PG', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: false,
      entries: [],
    });
    swapsRepo.findByAccount.mockResolvedValue([
      {
        id: BigInt(99),
        account: 'alice',
        transaction_id: 'waiv-swap',
        block_number: 1,
        ref_hive_block_number: 1,
        block_timestamp: new Date(400_000),
        symbol_out: 'SWAP.HIVE',
        symbol_in: 'WAIV',
        symbol_out_quantity: '10',
        symbol_in_quantity: '100',
        symbols: ['WAIV', 'SWAP.HIVE'],
        created_at: new Date(400_000),
      },
    ]);

    const result = await pager.collectPage({
      account: 'alice',
      limit: 5,
      cursor: null,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.source).toBe('swap');
    expect(result.items[0]?.payload.symbolIn).toBe('WAIV');
    expect(result.items[0]?.payload.symbolOut).toBe('SWAP.HIVE');
  });

  it('returns page 2 after cursor with mixed sources at same timestamp', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: false,
      entries: [
        {
          account: 'alice',
          quantity: '1',
          symbol: 'DEC',
          operation: 'tokens_transfer',
          timestamp: 200,
          transactionId: 'a',
        },
        {
          account: 'alice',
          quantity: '2',
          symbol: 'DEC',
          operation: 'tokens_stake',
          timestamp: 100,
          transactionId: 'b',
        },
      ],
    });
    swapsRepo.findByAccount.mockResolvedValue([
      {
        id: BigInt(1),
        account: 'alice',
        transaction_id: 'swap',
        block_number: 1,
        ref_hive_block_number: 1,
        block_timestamp: new Date(200_000),
        symbol_out: 'HIVE',
        symbol_in: 'DEC',
        symbol_out_quantity: '1',
        symbol_in_quantity: '1',
        symbols: ['DEC', 'HIVE'],
        created_at: new Date(200_000),
      },
    ]);

    const page1 = await pager.collectPage({
      account: 'alice',
      limit: 1,
      cursor: null,
    });
    expect(page1.items).toHaveLength(1);
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor).toBeTruthy();

    const page2 = await pager.collectPage({
      account: 'alice',
      limit: 1,
      cursor: page1.cursor,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]?.operation).not.toBe(page1.items[0]?.operation);
  });

  it('returns PG rows when RPC is unavailable', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: true,
      entries: [],
    });
    swapsRepo.findByAccount.mockResolvedValue([
      {
        id: BigInt(2),
        account: 'alice',
        transaction_id: 'swap-only',
        block_number: 1,
        ref_hive_block_number: 1,
        block_timestamp: new Date(300_000),
        symbol_out: 'SWAP.HIVE',
        symbol_in: 'WAIV',
        symbol_out_quantity: '1',
        symbol_in_quantity: '1',
        symbols: ['WAIV', 'SWAP.HIVE'],
        created_at: new Date(300_000),
      },
    ]);

    const result = await pager.collectPage({
      account: 'alice',
      limit: 5,
      cursor: null,
    });

    expect(result.rpcUnavailable).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.operation).toBe('marketpools_swapTokens');
  });
});

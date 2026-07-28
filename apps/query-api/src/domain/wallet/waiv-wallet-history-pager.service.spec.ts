import { WaivWalletHistoryPagerService } from './waiv-wallet-history-pager.service';

describe('WaivWalletHistoryPagerService', () => {
  const historyClient = {
    accountHistoryWithStatus: jest.fn(),
  };
  const swapsRepo = { findWaivByAccount: jest.fn() };
  const airdropsRepo = { findByAccount: jest.fn() };
  const depositRecordsRepo = { findForWaivWallet: jest.fn() };

  let pager: WaivWalletHistoryPagerService;

  beforeEach(() => {
    jest.clearAllMocks();
    pager = new WaivWalletHistoryPagerService(
      historyClient as never,
      swapsRepo as never,
      airdropsRepo as never,
      depositRecordsRepo as never,
    );
    swapsRepo.findWaivByAccount.mockResolvedValue([]);
    airdropsRepo.findByAccount.mockResolvedValue([]);
    depositRecordsRepo.findForWaivWallet.mockResolvedValue([]);
  });

  it('merges RPC and PG rows newest first', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: false,
      entries: [
        {
          account: 'alice',
          quantity: '1',
          symbol: 'WAIV',
          operation: 'tokens_transfer',
          timestamp: 200,
          transactionId: 'a',
        },
        {
          account: 'alice',
          quantity: '2',
          symbol: 'WAIV',
          operation: 'tokens_stake',
          timestamp: 100,
          transactionId: 'b',
        },
      ],
    });
    swapsRepo.findWaivByAccount.mockResolvedValue([
      {
        id: BigInt(1),
        account: 'alice',
        transaction_id: 'swap',
        block_number: 1,
        ref_hive_block_number: 1,
        block_timestamp: new Date(150_000),
        symbol_out: 'HIVE',
        symbol_in: 'WAIV',
        symbol_out_quantity: '1',
        symbol_in_quantity: '1',
        symbols: ['WAIV', 'HIVE'],
        created_at: new Date(150_000),
      },
    ]);

    const result = await pager.collectPage({
      account: 'alice',
      limit: 2,
      cursor: null,
      showRewards: false,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.operation).toBe('tokens_transfer');
    expect(result.items[1]?.operation).toBe('marketpools_swapTokens');
    expect(result.hasMore).toBe(true);
    expect(result.cursor).toBeTruthy();
  });

  it('returns page 2 after cursor with mixed sources at same timestamp', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: false,
      entries: [
        {
          account: 'alice',
          quantity: '1',
          symbol: 'WAIV',
          operation: 'tokens_transfer',
          timestamp: 200,
          transactionId: 'a',
        },
        {
          account: 'alice',
          quantity: '2',
          symbol: 'WAIV',
          operation: 'tokens_stake',
          timestamp: 100,
          transactionId: 'b',
        },
      ],
    });
    swapsRepo.findWaivByAccount.mockResolvedValue([
      {
        id: BigInt(1),
        account: 'alice',
        transaction_id: 'swap',
        block_number: 1,
        ref_hive_block_number: 1,
        block_timestamp: new Date(200_000),
        symbol_out: 'HIVE',
        symbol_in: 'WAIV',
        symbol_out_quantity: '1',
        symbol_in_quantity: '1',
        symbols: ['WAIV', 'HIVE'],
        created_at: new Date(200_000),
      },
    ]);

    const page1 = await pager.collectPage({
      account: 'alice',
      limit: 1,
      cursor: null,
      showRewards: false,
    });
    expect(page1.items).toHaveLength(1);
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor).toBeTruthy();

    const page2 = await pager.collectPage({
      account: 'alice',
      limit: 1,
      cursor: page1.cursor,
      showRewards: false,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]?.operation).not.toBe(page1.items[0]?.operation);
  });

  it('returns PG rows when RPC is unavailable', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: true,
      entries: [],
    });
    swapsRepo.findWaivByAccount.mockResolvedValue([
      {
        id: BigInt(2),
        account: 'alice',
        transaction_id: 'swap-only',
        block_number: 1,
        ref_hive_block_number: 1,
        block_timestamp: new Date(300_000),
        symbol_out: 'HIVE',
        symbol_in: 'WAIV',
        symbol_out_quantity: '1',
        symbol_in_quantity: '1',
        symbols: ['WAIV', 'HIVE'],
        created_at: new Date(300_000),
      },
    ]);

    const result = await pager.collectPage({
      account: 'alice',
      limit: 5,
      cursor: null,
      showRewards: false,
    });

    expect(result.rpcUnavailable).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.operation).toBe('marketpools_swapTokens');
  });

  it('merges deposit instruction rows from PG', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      unavailable: false,
      entries: [],
    });
    depositRecordsRepo.findForWaivWallet.mockResolvedValue([
      {
        id: BigInt(7),
        account: 'alice',
        transaction_id: 'dep-1',
        ref_hive_block_number: 1,
        block_timestamp: new Date(500_000),
        destination: 'alice',
        symbol_in: 'HIVE',
        symbol_out: 'WAIV',
        pair: 'HIVE/WAIV',
        ex_rate: 1.0075,
        deposit_account: 'honey-swap',
        address: null,
        memo: 'm1',
        symbols: ['HIVE', 'WAIV'],
        created_at: new Date(500_000),
      },
    ]);

    const result = await pager.collectPage({
      account: 'alice',
      limit: 5,
      cursor: null,
      showRewards: false,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      operation: 'hive_engine_deposit',
      kind: 'deposit_instruction',
      source: 'deposit',
    });
  });
});

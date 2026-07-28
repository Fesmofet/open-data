import {
  buildRpcHistoryTieId,
  mapAirdropRow,
  mapDepositRecordRow,
  mapRpcHistoryEntry,
  mapSwapRow,
} from './waiv-wallet-history-item-dtos';

describe('waiv-wallet-history-item-dtos', () => {
  it('computes market trade price from hive and token quantities', () => {
    const item = mapRpcHistoryEntry({
      account: 'alice',
      quantity: '4.048',
      quantityTokens: '4.048',
      quantityHive: '1',
      symbol: 'WAIV',
      operation: 'market_buy',
      timestamp: 1_700_000_000,
      transactionId: 'tx-buy',
      from: 'seller',
      to: 'alice',
    });
    expect(item.payload.price).toBe('0.24703557');
  });

  it('enriches limit buy place order quantity from locked and price', () => {
    const item = mapRpcHistoryEntry({
      account: 'alice',
      quantity: '',
      quantityLocked: '1',
      price: '4',
      orderType: 'buy',
      symbol: 'WAIV',
      operation: 'market_placeOrder',
      timestamp: 1_700_000_000,
      transactionId: 'tx-order',
    });
    expect(item.kind).toBe('market_order');
    expect(item.payload.quantity).toBe('0.25');
  });

  it('maps RPC transfer entry', () => {
    const item = mapRpcHistoryEntry({
      account: 'alice',
      quantity: '1.00000000',
      symbol: 'WAIV',
      operation: 'tokens_transfer',
      timestamp: 1_700_000_000,
      transactionId: 'tx-1',
      to: 'bob',
      from: 'alice',
      memo: 'hi',
    });
    expect(item.kind).toBe('transfer');
    expect(item.source).toBe('rpc');
    expect(item.payload.to).toBe('bob');
  });

  it('maps swap row', () => {
    const item = mapSwapRow({
      id: BigInt(42),
      account: 'alice',
      transaction_id: 'tx-swap',
      block_number: 1,
      ref_hive_block_number: 1,
      block_timestamp: new Date('2024-01-02T00:00:00.000Z'),
      symbol_out: 'HIVE',
      symbol_in: 'WAIV',
      symbol_out_quantity: '1',
      symbol_in_quantity: '2',
      symbols: ['WAIV', 'HIVE'],
      created_at: new Date('2024-01-02T00:00:00.000Z'),
    });
    expect(item.kind).toBe('swap');
    expect(item.id).toBe('swap:42');
  });

  it('maps airdrop row', () => {
    const item = mapAirdropRow({
      id: BigInt(7),
      account: 'alice',
      transaction_id: 'tx-air',
      block_number: 1,
      ref_hive_block_number: 1,
      block_timestamp: new Date('2024-01-03T00:00:00.000Z'),
      quantity: '10',
      token_state: 'liquid',
      created_at: new Date('2024-01-03T00:00:00.000Z'),
    });
    expect(item.kind).toBe('airdrop');
    expect(item.payload.tokenState).toBe('liquid');
  });

  it('maps deposit instruction row', () => {
    const item = mapDepositRecordRow({
      id: BigInt(9),
      account: 'gobag',
      transaction_id: 'tx-dep',
      ref_hive_block_number: 90_000_000,
      block_timestamp: new Date('2024-01-04T00:00:00.000Z'),
      destination: 'gobag',
      symbol_in: 'HIVE',
      symbol_out: 'SWAP.HIVE',
      pair: 'HIVE -> SWAP.HIVE',
      ex_rate: 1.0075,
      deposit_account: 'honey-swap',
      address: null,
      memo: '{"id":"ssc-mainnet-hive"}',
      symbols: ['HIVE', 'SWAP.HIVE'],
      created_at: new Date('2024-01-04T00:00:00.000Z'),
    });
    expect(item).toMatchObject({
      id: 'deposit:9',
      operation: 'hive_engine_deposit',
      kind: 'deposit_instruction',
      source: 'deposit',
      payload: {
        symbolIn: 'HIVE',
        symbolOut: 'SWAP.HIVE',
        depositAccount: 'honey-swap',
        exRate: 1.0075,
      },
    });
  });

  it('buildRpcHistoryTieId disambiguates reward rows in the same transaction', () => {
    const base = {
      account: 'grampo',
      symbol: 'WAIV',
      operation: 'comments_curationReward',
      timestamp: 1_700_000_000,
      transactionId: 'tx-reward',
    };
    const a = buildRpcHistoryTieId({
      ...base,
      authorperm: '@author/post-a',
      quantity: '0.16709602',
    });
    const b = buildRpcHistoryTieId({
      ...base,
      authorperm: '@author/post-b',
      quantity: '0.16711291',
    });
    expect(a).not.toBe(b);
  });

  it('buildRpcHistoryTieId disambiguates same-amount transfers in one transaction', () => {
    const base = {
      account: 'grampo',
      symbol: 'WAIV',
      operation: 'tokens_transfer',
      timestamp: 1_700_000_000,
      transactionId: 'tx-batch',
      quantity: '1500',
      from: 'grampo',
    };
    const a = buildRpcHistoryTieId({ ...base, to: 'jeffjagoe' });
    const b = buildRpcHistoryTieId({ ...base, to: 'gmamba13' });
    expect(a).not.toBe(b);
  });
});

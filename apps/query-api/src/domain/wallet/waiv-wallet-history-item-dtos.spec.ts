import {
  mapAirdropRow,
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
});

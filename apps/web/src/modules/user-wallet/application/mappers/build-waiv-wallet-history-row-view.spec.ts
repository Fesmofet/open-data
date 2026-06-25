import { buildWaivWalletHistoryRowView } from './build-waiv-wallet-history-row-view';
import type { WaivWalletHistoryItemApi } from '../dto/waiv-wallet-history-api.schema';

function item(partial: Partial<WaivWalletHistoryItemApi> & Pick<WaivWalletHistoryItemApi, 'kind' | 'operation'>): WaivWalletHistoryItemApi {
  return {
    id: 'rpc:tx:1',
    timestamp: '2024-01-01T00:00:00.000Z',
    source: 'rpc',
    payload: {},
    ...partial,
  };
}

describe('buildWaivWalletHistoryRowView', () => {
  it('maps incoming transfer with positive amount tone', () => {
    const view = buildWaivWalletHistoryRowView(
      item({
        kind: 'transfer',
        operation: 'tokens_transfer',
        payload: {
          from: 'bob',
          to: 'alice',
          quantity: '5',
          symbol: 'WAIV',
          memo: 'hello',
        },
      }),
      'alice',
    );
    expect(view).toMatchObject({
      kind: 'transfer',
      direction: 'in',
      memo: 'hello',
      amountView: { tone: 'positive', sign: '+', currency: 'WAIV' },
    });
  });

  it('maps market buy with rate label from string price', () => {
    const view = buildWaivWalletHistoryRowView(
      item({
        kind: 'market_trade',
        operation: 'market_buy',
        payload: {
          quantityTokens: '4.048',
          quantityHive: '1',
          price: '0.24703557',
          symbol: 'WAIV',
          from: 'seller',
        },
      }),
      'alice',
    );
    if (view.kind !== 'market_trade') {
      throw new Error('expected market_trade');
    }
    expect(view.isBuy).toBe(true);
    expect(view.rateLabel).toBe('0.247 per WAIV');
    expect(view.tokenAmount.sign).toBe('+');
    expect(view.hiveAmount.sign).toBe('-');
  });

  it('maps limit buy place order with locked and other amounts', () => {
    const view = buildWaivWalletHistoryRowView(
      item({
        kind: 'market_order',
        operation: 'market_placeOrder',
        payload: {
          orderType: 'buy',
          quantityLocked: '1',
          quantity: '4.048',
          price: '0.24703557',
          symbol: 'WAIV',
        },
      }),
      'alice',
    );
    if (view.kind !== 'market_order') {
      throw new Error('expected market_order');
    }
    expect(view.isLimitOrder).toBe(true);
    expect(view.lockedAmountLabel).toContain('SWAP.HIVE');
    expect(view.otherAmountLabel).toContain('WAIV');
    expect(view.priceLabel).toContain('per WAIV');
  });

  it('maps market cancel with buy side label fields', () => {
    const view = buildWaivWalletHistoryRowView(
      item({
        kind: 'market_cancel',
        operation: 'market_cancel',
        payload: {
          orderType: 'buy',
          quantityReturned: '1',
          symbol: 'SWAP.HIVE',
        },
      }),
      'alice',
    );
    expect(view).toMatchObject({
      kind: 'market_cancel',
      orderType: 'buy',
      amount: expect.stringContaining('SWAP.HIVE'),
    });
  });

  it('maps curation reward authorperm', () => {
    const view = buildWaivWalletHistoryRowView(
      item({
        kind: 'curation_reward',
        operation: 'comments_curationReward',
        payload: {
          quantity: '0.00026163',
          symbol: 'WAIV',
          authorperm: '@author/post-slug',
        },
      }),
      'alice',
    );
    if (view.kind !== 'curation_reward') {
      throw new Error('expected curation_reward');
    }
    expect(view.amountView.amount).toBe('0.00026');
    expect(view.authorperm).toBe('@author/post-slug');
  });
});

export type WaivAmountTone = 'positive' | 'negative' | 'neutral';

/** `none` = no +/- prefix (legacy black amounts). */
export type WaivAmountSign = '+' | '-' | 'none';

export type WaivAmountView = {
  amount: string;
  currency: string;
  tone: WaivAmountTone;
  sign: WaivAmountSign;
};

export type WaivWalletHistoryRowKind =
  | 'transfer'
  | 'power_up'
  | 'power_down_start'
  | 'power_down_stop'
  | 'power_down_done'
  | 'delegate'
  | 'undelegate_start'
  | 'undelegate_done'
  | 'market_trade'
  | 'market_order'
  | 'market_cancel'
  | 'market_expire'
  | 'market_close'
  | 'market_partial'
  | 'lottery'
  | 'mining'
  | 'pegged_deposit'
  | 'pegged_withdraw'
  | 'author_reward'
  | 'curation_reward'
  | 'beneficiary_reward'
  | 'swap'
  | 'airdrop'
  | 'generic';

export type WaivMarketOrderType = 'buy' | 'sell' | 'marketbuy' | 'marketsell';

export type WaivWalletHistoryRowView =
  | {
      kind: 'transfer';
      id: string;
      timestamp: string;
      direction: 'in' | 'out' | 'self';
      amountView: WaivAmountView;
      counterparty: string;
      memo: string;
    }
  | {
      kind: 'power_up';
      id: string;
      timestamp: string;
      direction: 'in' | 'out' | 'self';
      amountView: WaivAmountView;
      counterparty: string;
    }
  | {
      kind: 'power_down_start' | 'power_down_stop' | 'power_down_done';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
    }
  | {
      kind: 'delegate';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
      counterparty: string;
      isIncoming: boolean;
    }
  | {
      kind: 'undelegate_start';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
      counterparty: string;
      isIncoming: boolean;
    }
  | {
      kind: 'undelegate_done';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
    }
  | {
      kind: 'market_trade' | 'market_partial';
      id: string;
      timestamp: string;
      tokenAmount: WaivAmountView;
      hiveAmount: WaivAmountView;
      isBuy: boolean;
      counterparty: string;
      /** Legacy: `{price} per {symbol}` on the timestamp row. */
      rateLabel: string | null;
    }
  | {
      kind: 'market_order';
      id: string;
      timestamp: string;
      orderType: WaivMarketOrderType;
      isLimitOrder: boolean;
      lockedAmountLabel: string;
      otherAmountLabel: string | null;
      priceLabel: string | null;
    }
  | {
      kind: 'market_cancel' | 'market_expire';
      id: string;
      timestamp: string;
      orderType: 'buy' | 'sell';
      amount: string;
    }
  | {
      kind: 'market_close';
      id: string;
      timestamp: string;
      orderType: 'buy' | 'sell';
    }
  | {
      kind: 'lottery' | 'mining';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
    }
  | {
      kind: 'pegged_deposit' | 'pegged_withdraw';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
    }
  | {
      kind: 'author_reward' | 'beneficiary_reward';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
      authorperm: string;
    }
  | {
      kind: 'curation_reward';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
      authorperm: string;
    }
  | {
      kind: 'swap';
      id: string;
      timestamp: string;
      symbolOut: string;
      symbolIn: string;
      quantityOut: string;
      quantityIn: string;
      /** Legacy: `{rate} {symbolOut} per {symbolIn}` on the timestamp row. */
      rateLabel: string | null;
    }
  | {
      kind: 'airdrop';
      id: string;
      timestamp: string;
      amountView: WaivAmountView;
      tokenState: string;
    }
  | {
      kind: 'generic';
      id: string;
      timestamp: string;
      operation: string;
      amountView: WaivAmountView | null;
    };

export type WaivWalletHistoryPageView = {
  items: WaivWalletHistoryRowView[];
  cursor: string | null;
  hasMore: boolean;
};

export type WaivWalletHistoryLoadError = 'unavailable' | 'invalid_response';

export type WaivWalletHistoryPageQueryResult = {
  page: WaivWalletHistoryPageView;
  error: WaivWalletHistoryLoadError | null;
};

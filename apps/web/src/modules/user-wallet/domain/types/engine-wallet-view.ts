export type EngineWalletLoadError = 'unavailable' | 'invalid_response';

export type EngineTokenBalanceRowView = {
  symbol: string;
  name: string;
  iconUrl: string | null;
  balance: string;
  stake: string;
  stakingEnabled: boolean;
  precision: number;
  usdEstimate: number;
  isPinned: boolean;
};

export type EngineWalletSummaryView = {
  account: string;
  pinnedTokens: EngineTokenBalanceRowView[];
  tokens: EngineTokenBalanceRowView[];
  estimatedAccountValueUsd: number;
  rates: {
    hiveUsd: number;
  };
};

export type EngineWalletQueryResult = {
  summary: EngineWalletSummaryView | null;
  error: EngineWalletLoadError | null;
};

export type {
  WaivWalletHistoryLoadError as EngineWalletHistoryLoadError,
  WaivWalletHistoryPageQueryResult as EngineWalletHistoryPageQueryResult,
  WaivWalletHistoryPageView as EngineWalletHistoryPageView,
  WaivWalletHistoryRowView as EngineWalletHistoryRowView,
} from './waiv-wallet-history-view';

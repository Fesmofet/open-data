export type WaivWalletSummaryView = {
  account: string;
  balance: {
    liquid: string;
    stake: string;
    delegationsIn: string;
    delegationsOut: string;
    pendingUnstake: string;
    pendingUndelegations: string;
  };
  display: {
    liquidWaiv: string;
    waivPower: string;
    delegationsNet: string;
    estAccountValueUsd: string;
  };
  flags: {
    showDelegationsRow: boolean;
    showPowerDownRow: boolean;
  };
  powerDown?: {
    nextUnstakeAt: number | null;
  };
  rates: {
    waivHive: number;
    waivUsd: number;
  };
};

export type WaivWalletLoadError = 'unavailable' | 'invalid_response';

export type WaivWalletQueryResult = {
  summary: WaivWalletSummaryView | null;
  error: WaivWalletLoadError | null;
};

export type EngineTokenDelegationItemView = {
  from: string;
  to: string;
  symbol: string;
  quantity: string;
};

export type EngineTokenDelegationsView = {
  account: string;
  symbol: string;
  incoming: EngineTokenDelegationItemView[];
  outgoing: EngineTokenDelegationItemView[];
};

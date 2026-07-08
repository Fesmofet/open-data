export type MarketTokenSymbol = 'WAIV' | 'HIVE' | 'HBD';

export type ChartPoint = {
  label: string;
  value: number;
};

export type SecondaryPriceQuote = {
  currency: string;
  price: number;
  changePercent: number;
};

export type TokenMarketRow = {
  symbol: MarketTokenSymbol;
  usdPrice: number | null;
  usdChangePercent: number | null;
  showUsdChangePercent: boolean;
  secondary: SecondaryPriceQuote | null;
  sparkline: ChartPoint[];
};

export type CurrencyMarketPanelData = {
  tokens: TokenMarketRow[];
  fetchedAt: string;
};

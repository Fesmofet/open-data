export type HiveEngineConvertRequest = {
  from_coin: string;
  to_coin: string;
  destination: string;
};

export type HiveEngineConvertResponse = {
  account?: string;
  memo?: string;
  address?: string;
  deposit_address?: string;
  deposit_account?: string;
  deposit_memo?: string;
  ex_rate?: number;
  pair?: string;
  destination?: string;
  error?: string;
};

export type HiveEngineConverterPair = {
  from_coin_symbol: string;
  to_coin_symbol: string;
  pair?: string;
};

export type HiveEngineConverterCoin = {
  symbol: string;
  display_name: string;
};

export type HiveEngineAccountHistoryParams = {
  account: string;
  symbol?: string;
  ops?: string;
  timestampStart?: number;
  timestampEnd?: number;
  limit?: number;
  offset?: number;
};

export type HiveEngineAccountHistoryEntry = {
  account: string;
  authorperm?: string;
  quantity: string;
  symbol: string;
  operation: string;
  timestamp: number;
  transactionId?: string;
  blockNumber?: number;
};

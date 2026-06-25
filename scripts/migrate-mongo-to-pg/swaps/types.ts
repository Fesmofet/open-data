export type MongoEngineAccountHistorySwap = {
  account?: string;
  transactionId?: string;
  blockNumber?: number;
  refHiveBlockNumber?: number;
  timestamp?: number;
  symbolOut?: string;
  symbolIn?: string;
  symbolOutQuantity?: string;
  symbolInQuantity?: string;
  operation?: string;
};

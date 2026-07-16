export type WaivEngineVoteEvent = {
  author: string;
  permlink: string;
  voter: string;
  weight: number;
  rshares: number;
  symbol: string;
};

export type WaivEngineRewardEvent = {
  heTransactionId: string;
  authorperm: string;
  quantity: number;
  symbol: string;
  event: string;
  account: string;
  refHiveBlockNumber: number;
  trxIndex: number;
  logIndex: number;
};

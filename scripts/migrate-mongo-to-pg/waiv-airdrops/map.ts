export type MongoEngineAccountHistoryAirdrop = {
  account?: string;
  transactionId?: string;
  blockNumber?: number;
  refHiveBlockNumber?: number;
  timestamp?: number;
  quantity?: string | number;
  tokenState?: string;
  symbol?: string;
  operation?: string;
};

export const WAIV_AIRDROP_OPERATION = 'airdrops_newAirdrop';
export const WAIV_SYMBOL = 'WAIV';

export type WaivAirdropRow = {
  account: string;
  transaction_id: string;
  block_number: number;
  ref_hive_block_number: number;
  block_timestamp: Date;
  quantity: string;
  token_state: string;
};

function str(value: unknown): string {
  return String(value ?? '').trim();
}

function num(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mongoWaivAirdropToRow(
  doc: MongoEngineAccountHistoryAirdrop,
): WaivAirdropRow | null {
  if (doc.operation && doc.operation !== WAIV_AIRDROP_OPERATION) {
    return null;
  }

  const symbol = str(doc.symbol).toUpperCase();
  if (symbol !== WAIV_SYMBOL) {
    return null;
  }

  const account = str(doc.account);
  const transactionId = str(doc.transactionId);
  const blockNumber = num(doc.blockNumber);
  const refHiveBlockNumber = num(doc.refHiveBlockNumber);
  const timestampUnix = num(doc.timestamp);
  const quantity = str(doc.quantity);
  const tokenState = str(doc.tokenState);

  if (
    !account ||
    !transactionId ||
    blockNumber === null ||
    refHiveBlockNumber === null ||
    timestampUnix === null ||
    !quantity ||
    !tokenState
  ) {
    return null;
  }

  return {
    account,
    transaction_id: transactionId,
    block_number: blockNumber,
    ref_hive_block_number: refHiveBlockNumber,
    block_timestamp: new Date(timestampUnix * 1000),
    quantity,
    token_state: tokenState,
  };
}

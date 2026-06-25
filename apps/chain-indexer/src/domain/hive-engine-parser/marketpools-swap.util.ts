export type ParsedMarketpoolsSwap = {
  account: string;
  transactionId: string;
  blockNumber: number;
  refHiveBlockNumber: number;
  blockTimestampUnix: number;
  symbolOut: string;
  symbolIn: string;
  symbolOutQuantity: string;
  symbolInQuantity: string;
};

export const MARKETPOOLS_CONTRACT = 'marketpools';
export const SWAP_TOKENS_ACTION = 'swapTokens';

const SWAP_TOKENS_EVENT = 'swapTokens';
const TRANSFER_FROM_CONTRACT_EVENT = 'transferFromContract';
const TRANSFER_TO_CONTRACT_EVENT = 'transferToContract';

function str(value: unknown): string {
  return String(value ?? '').trim();
}

function findEvent(
  events: { event: string; data: Record<string, unknown> }[],
  name: string,
): { event: string; data: Record<string, unknown> } | undefined {
  return events.find((e) => e.event === name);
}

/**
 * Extract one atomic swap row from a marketpools/swapTokens transaction.
 * Mapping matches legacy swapHistoryParser.js (transferFromContract → out qty).
 */
export function extractSwapFromTransaction(
  tx: {
    sender: string;
    transactionId: string;
    refHiveBlockNumber: number;
  },
  blockNumber: number,
  blockTimestampUnix: number,
  events: { event: string; data: Record<string, unknown> }[],
): ParsedMarketpoolsSwap | null {
  const swapTokens = findEvent(events, SWAP_TOKENS_EVENT);
  const transferFromContract = findEvent(events, TRANSFER_FROM_CONTRACT_EVENT);
  const transferToContract = findEvent(events, TRANSFER_TO_CONTRACT_EVENT);

  if (!swapTokens || !transferFromContract || !transferToContract) {
    return null;
  }

  const symbolOut = str(swapTokens.data.symbolOut);
  const symbolIn = str(swapTokens.data.symbolIn);
  const symbolOutQuantity = str(transferFromContract.data.quantity);
  const symbolInQuantity = str(transferToContract.data.quantity);
  const account = str(tx.sender);

  if (
    !account ||
    !symbolOut ||
    !symbolIn ||
    !symbolOutQuantity ||
    !symbolInQuantity
  ) {
    return null;
  }

  return {
    account,
    transactionId: tx.transactionId,
    blockNumber,
    refHiveBlockNumber: tx.refHiveBlockNumber,
    blockTimestampUnix,
    symbolOut,
    symbolIn,
    symbolOutQuantity,
    symbolInQuantity,
  };
}

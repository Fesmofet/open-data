import { HIVE_OP } from '@opden-data-layer/core';
import type { HiveAccountHistoryRow } from '@opden-data-layer/clients';

export type ActivityItemDto = {
  id: string;
  operationIndex: number;
  trxId: string;
  timestamp: string;
  block: number;
  type: string;
  payload: Record<string, unknown>;
};

export type ActivityChainContextDto = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
};

export type UserActivityResponse = {
  items: ActivityItemDto[];
  cursor: string | null;
  hasMore: boolean;
  chainContext: ActivityChainContextDto;
};

function toIsoTimestamp(timestamp: string): string {
  const trimmed = timestamp.trim();
  if (trimmed.endsWith('Z')) {
    return trimmed;
  }
  return `${trimmed}Z`;
}

export function mapHiveAccountHistoryRow(
  row: HiveAccountHistoryRow,
): ActivityItemDto | null {
  const [operationIndex, entry] = row;
  const opType = entry.op[0];
  if (opType === HIVE_OP.EFFECTIVE_COMMENT_VOTE) {
    return null;
  }
  return {
    id: `${entry.trx_id}:${operationIndex}`,
    operationIndex,
    trxId: entry.trx_id,
    timestamp: toIsoTimestamp(entry.timestamp),
    block: entry.block,
    type: opType,
    payload: entry.op[1] ?? {},
  };
}

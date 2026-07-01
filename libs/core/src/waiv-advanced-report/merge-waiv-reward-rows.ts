import { WAIV_HISTORY_REWARD_OPS } from '../hive-engine-history/waiv-wallet-history-ops';
import { stableWaivAdvancedReportOperationIndex } from './stable-operation-index';

/** Legacy generated-report reward fold window (30 days). */
export const WAIV_MERGE_REWARDS_WINDOW_SEC = 30 * 24 * 60 * 60;

const REWARD_OPS = new Set<string>(WAIV_HISTORY_REWARD_OPS);

export type MergeWaivRewardRowInput = {
  userName: string;
  operationIndex: number;
  timestamp: number;
  dateYmd?: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  memo: string;
  withdrawDeposit: '' | 'd' | 'w';
  payload: Record<string, unknown>;
  /**
   * Optional pre-computed per-row fields. When present (rows priced BEFORE merge),
   * the merged row sums them so daily WAIV/USD rates are preserved instead of
   * re-pricing the summed quantity at a single (anchor) rate.
   */
  checked?: boolean;
  waivAmount?: string;
  wpAmount?: string;
  totalFiat?: number;
  waivFiat?: number;
  wpFiat?: number;
};

export type WaivMergeRewardFoldState<
  T extends MergeWaivRewardRowInput = MergeWaivRewardRowInput,
> = {
  /** Newest timestamp in the fold (anchor in legacy desc-ordered stream). */
  anchorTimestamp: number;
  group: T[];
};

export type MergeWaivRewardRowsStreamResult<T extends MergeWaivRewardRowInput> = {
  rows: T[];
  fold: WaivMergeRewardFoldState<T> | null;
};

function isRewardRow(row: MergeWaivRewardRowInput): boolean {
  return REWARD_OPS.has(row.type);
}

function sumAmounts(values: readonly string[]): string {
  const total = values.reduce((acc, value) => {
    const n = Number(value.trim());
    return Number.isFinite(n) ? acc + n : acc;
  }, 0);
  return total.toFixed(8).replace(/\.?0+$/, '') || '0';
}

function sumNumbers(values: readonly (number | undefined)[]): number {
  return values.reduce<number>((acc, value) => {
    return typeof value === 'number' && Number.isFinite(value) ? acc + value : acc;
  }, 0);
}

/** Legacy: current reward is more than 30 days older than fold anchor. */
function exceedsMergeWindow(anchorTimestamp: number, timestamp: number): boolean {
  return timestamp < anchorTimestamp - WAIV_MERGE_REWARDS_WINDOW_SEC;
}

function buildMergedRewardRow<T extends MergeWaivRewardRowInput>(
  group: readonly T[],
  anchorTimestamp: number,
): T {
  const first = group[0]!;
  const totalAmount = sumAmounts(group.map((row) => row.amount));
  const tieId = `merged-rewards:${first.userName}:${anchorTimestamp}`;
  const operationIndex = stableWaivAdvancedReportOperationIndex({
    source: 'generated',
    account: first.userName,
    timestamp: anchorTimestamp,
    tieId,
  });
  const merged: MergeWaivRewardRowInput = {
    ...first,
    operationIndex,
    timestamp: anchorTimestamp,
    type: 'merged_rewards',
    amount: totalAmount,
    memo: '',
    withdrawDeposit: 'd',
    payload: {
      mergedRewardCount: group.length,
      mergedTypes: [...new Set(group.map((row) => row.type))],
    },
  };

  // Preserve per-day pricing: when rows were priced before merge, sum the fiat
  // fields instead of letting the summed quantity be re-priced at one rate.
  if (group.some((row) => row.totalFiat !== undefined)) {
    merged.totalFiat = sumNumbers(group.map((row) => row.totalFiat));
  }
  if (group.some((row) => row.waivFiat !== undefined)) {
    merged.waivFiat = sumNumbers(group.map((row) => row.waivFiat));
  }
  if (group.some((row) => row.wpFiat !== undefined)) {
    merged.wpFiat = sumNumbers(group.map((row) => row.wpFiat));
  }
  if (first.waivAmount !== undefined) {
    merged.waivAmount = totalAmount;
    merged.wpAmount = '';
  }
  if (first.checked !== undefined) {
    merged.checked = false;
  }

  return merged as T;
}

export function flushMergeRewardFold<T extends MergeWaivRewardRowInput>(
  fold: WaivMergeRewardFoldState<T> | null | undefined,
): T[] {
  if (!fold || fold.group.length === 0) {
    return [];
  }
  return [buildMergedRewardRow(fold.group, fold.anchorTimestamp)];
}

/**
 * Legacy mergeRewards: walk stream in order (newest first), fold consecutive reward
 * ops until a non-reward breaks the streak or the next reward is >30 days older
 * than the fold anchor. Pending fold is returned for the next batch.
 */
export function mergeWaivRewardRowsInStream<T extends MergeWaivRewardRowInput>(
  rows: readonly T[],
  mergeRewards: boolean,
  initialFold: WaivMergeRewardFoldState<T> | null = null,
): MergeWaivRewardRowsStreamResult<T> {
  if (!mergeRewards) {
    return { rows: [...rows], fold: null };
  }
  if (rows.length === 0) {
    return { rows: [], fold: initialFold };
  }

  const output: T[] = [];
  let fold = initialFold;

  for (const row of rows) {
    if (!isRewardRow(row)) {
      if (fold) {
        output.push(buildMergedRewardRow(fold.group, fold.anchorTimestamp));
        fold = null;
      }
      output.push(row);
      continue;
    }

    if (!fold) {
      fold = { anchorTimestamp: row.timestamp, group: [row] };
      continue;
    }

    if (exceedsMergeWindow(fold.anchorTimestamp, row.timestamp)) {
      fold.group.push(row);
      output.push(buildMergedRewardRow(fold.group, fold.anchorTimestamp));
      fold = null;
      continue;
    }

    fold.group.push(row);
  }

  return { rows: output, fold };
}

/** Full-stream merge (flushes pending fold). */
export function mergeWaivRewardRows<T extends MergeWaivRewardRowInput>(
  rows: readonly T[],
  mergeRewards: boolean,
): T[] {
  if (!mergeRewards) {
    return [...rows];
  }
  const { rows: merged, fold } = mergeWaivRewardRowsInStream(rows, true, null);
  return [...merged, ...flushMergeRewardFold(fold)];
}

export function isWaivAdvancedReportRewardOp(operation: string): boolean {
  return REWARD_OPS.has(operation);
}

export function parseWaivMergeRewardFoldState(
  value: unknown,
): WaivMergeRewardFoldState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const anchorTimestamp = record['anchorTimestamp'];
  const group = record['group'];
  if (typeof anchorTimestamp !== 'number' || !Array.isArray(group) || group.length === 0) {
    return null;
  }
  return {
    anchorTimestamp,
    group: group as MergeWaivRewardRowInput[],
  };
}

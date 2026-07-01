import {
  flushMergeRewardFold,
  mergeWaivRewardRows,
  mergeWaivRewardRowsInStream,
  WAIV_MERGE_REWARDS_WINDOW_SEC,
} from './merge-waiv-reward-rows';
import { stableWaivAdvancedReportOperationIndex } from './stable-operation-index';
import type { MergeWaivRewardRowInput } from './merge-waiv-reward-rows';

describe('mergeWaivRewardRows', () => {
  const reward = (
    overrides: Partial<MergeWaivRewardRowInput>,
  ): MergeWaivRewardRowInput => ({
    userName: 'alice',
    operationIndex: 1,
    timestamp: 1_700_000_000,
    dateYmd: '2023-11-14',
    type: 'comments_curationReward',
    from: '',
    to: 'alice',
    amount: '0.5',
    memo: '',
    withdrawDeposit: 'd',
    payload: { authorperm: '@a/post-1' },
    ...overrides,
  });

  const transfer = (overrides: Partial<MergeWaivRewardRowInput> = {}): MergeWaivRewardRowInput => ({
    userName: 'alice',
    operationIndex: 99,
    timestamp: 1_700_000_000,
    dateYmd: '2023-11-14',
    type: 'tokens_transfer',
    from: 'bob',
    to: 'alice',
    amount: '10',
    memo: 'hi',
    withdrawDeposit: 'd',
    payload: {},
    ...overrides,
  });

  it('returns rows unchanged when mergeRewards is false', () => {
    const rows = [
      reward({ operationIndex: 1 }),
      reward({ operationIndex: 2, type: 'comments_authorReward' }),
    ];
    expect(mergeWaivRewardRows(rows, false)).toEqual(rows);
  });

  it('merges consecutive rewards within 30 days before a non-reward break', () => {
    const rows = [
      reward({ operationIndex: 10, amount: '0.5' }),
      reward({
        operationIndex: 11,
        type: 'comments_authorReward',
        amount: '1.5',
        payload: { authorperm: '@b/post-2' },
      }),
      transfer(),
    ];

    const merged = mergeWaivRewardRows(rows, true);
    expect(merged).toHaveLength(2);
    const mergedReward = merged.find((row) => row.type === 'merged_rewards');
    expect(mergedReward?.amount).toBe('2');
    expect(mergedReward?.withdrawDeposit).toBe('d');
    expect(mergedReward?.operationIndex).toBe(
      stableWaivAdvancedReportOperationIndex({
        source: 'generated',
        account: 'alice',
        timestamp: 1_700_000_000,
        tieId: 'merged-rewards:alice:1700000000',
      }),
    );
  });

  it('includes the out-of-window reward in the fold before flushing (legacy)', () => {
    const anchor = 1_700_000_000;
    const older = anchor - WAIV_MERGE_REWARDS_WINDOW_SEC - 86_400;
    const rows = [
      reward({ timestamp: anchor, operationIndex: 1, amount: '1' }),
      reward({ timestamp: older, operationIndex: 2, amount: '2', dateYmd: '2023-10-01' }),
    ];
    const merged = mergeWaivRewardRows(rows, true);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.type).toBe('merged_rewards');
    expect(merged[0]?.amount).toBe('3');
  });

  it('starts a new fold after a 30-day flush when more rewards follow', () => {
    const anchor = 1_700_000_000;
    const older = anchor - WAIV_MERGE_REWARDS_WINDOW_SEC - 86_400;
    const oldest = older - WAIV_MERGE_REWARDS_WINDOW_SEC - 86_400;
    const rows = [
      reward({ timestamp: anchor, operationIndex: 1, amount: '1' }),
      reward({ timestamp: older, operationIndex: 2, amount: '2' }),
      reward({ timestamp: oldest, operationIndex: 3, amount: '4' }),
    ];
    const merged = mergeWaivRewardRows(rows, true);
    expect(merged).toHaveLength(2);
    expect(merged.map((row) => row.amount)).toEqual(['3', '4']);
  });

  it('flushes a single trailing reward as merged_rewards', () => {
    const merged = mergeWaivRewardRows([reward({ amount: '3' })], true);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.type).toBe('merged_rewards');
    expect(merged[0]?.amount).toBe('3');
  });

  it('carries fold state across stream batches', () => {
    const batch1 = [
      reward({ operationIndex: 1, amount: '0.5' }),
      reward({ operationIndex: 2, type: 'comments_authorReward', amount: '1.5' }),
    ];
    const firstPass = mergeWaivRewardRowsInStream(batch1, true, null);
    expect(firstPass.rows).toHaveLength(0);
    expect(firstPass.fold?.group).toHaveLength(2);

    const batch2 = [transfer()];
    const secondPass = mergeWaivRewardRowsInStream(batch2, true, firstPass.fold);
    expect(secondPass.rows).toHaveLength(2);
    expect(secondPass.rows[0]?.type).toBe('merged_rewards');
    expect(secondPass.rows[0]?.amount).toBe('2');
    expect(secondPass.fold).toBeNull();
  });

  it('sums pre-priced fiat fields instead of re-pricing the merged quantity', () => {
    const rows = [
      reward({
        operationIndex: 10,
        amount: '100',
        waivAmount: '100',
        wpAmount: '',
        totalFiat: 1.1,
        waivFiat: 1.1,
        wpFiat: 0,
        checked: false,
      }),
      reward({
        operationIndex: 11,
        type: 'comments_authorReward',
        amount: '100',
        waivAmount: '100',
        wpAmount: '',
        totalFiat: 1.4,
        waivFiat: 1.4,
        wpFiat: 0,
        checked: false,
      }),
      transfer(),
    ];

    const merged = mergeWaivRewardRows(rows, true);
    const mergedReward = merged.find((row) => row.type === 'merged_rewards');
    expect(mergedReward?.amount).toBe('200');
    expect(mergedReward?.waivAmount).toBe('200');
    // Correct sum of per-day USD (1.1 + 1.4), not 200 * anchorRate.
    expect(mergedReward?.totalFiat).toBeCloseTo(2.5, 8);
    expect(mergedReward?.waivFiat).toBeCloseTo(2.5, 8);
    expect(mergedReward?.checked).toBe(false);
  });

  it('flushMergeRewardFold emits pending rewards', () => {
    const fold = {
      anchorTimestamp: 1_700_000_000,
      group: [reward({ amount: '4' })],
    };
    expect(flushMergeRewardFold(fold)).toHaveLength(1);
    expect(flushMergeRewardFold(null)).toEqual([]);
  });
});

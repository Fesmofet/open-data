import { parsePayoutAmount } from '@opden-data-layer/core';

export type VoteValuePostContext = {
  pendingPayoutValue: string;
  totalPayoutValue: string;
  curatorPayoutValue: string;
  cashoutTime: string | null;
  totalPayoutWaiv: number;
  totalRewardsWaiv: number;
  netRsharesWaiv: number;
  /** Sum of `rshares` across all active votes (legacy `postRatioCalculate`). */
  totalHiveRsharesSum: number;
  /** Sum of `rshares_waiv` across active votes; preferred WAIV denominator when set. */
  totalWaivRsharesSum: number;
};

export type VoteValueVoteInput = {
  rshares: number;
  rsharesWaiv: number;
};

function waivNetRsharesDenominator(post: VoteValuePostContext): number {
  if (post.totalWaivRsharesSum > 0) {
    return post.totalWaivRsharesSum;
  }
  return post.netRsharesWaiv;
}

/** Same WAIV token pool selection as `calculatePostRewardUsd`. */
function waivPayoutTokens(post: VoteValuePostContext): number {
  return post.totalRewardsWaiv > 0 ? post.totalRewardsWaiv : post.totalPayoutWaiv;
}

function waivRatioPerRshare(
  post: VoteValuePostContext,
  waivUsdRate: number,
): number {
  const netWaiv = waivNetRsharesDenominator(post);
  if (netWaiv <= 0 || waivUsdRate <= 0) {
    return 0;
  }
  const payoutTokens = waivPayoutTokens(post);
  if (payoutTokens <= 0) {
    return 0;
  }
  return (payoutTokens / netWaiv) * waivUsdRate;
}

/**
 * Legacy Waivio `postPayoutCalculate` — per-voter USD from rshares + WAIV rshares.
 */
export function calculateVoteValueUsd(
  post: VoteValuePostContext,
  vote: VoteValueVoteInput,
  waivUsdRate: number,
): number {
  const totalPayout =
    parsePayoutAmount(post.pendingPayoutValue) +
    parsePayoutAmount(post.totalPayoutValue) +
    parsePayoutAmount(post.curatorPayoutValue);

  const hiveRshares = post.totalHiveRsharesSum;
  const ratio = hiveRshares > 0 ? totalPayout / hiveRshares : 0;
  const waivRatio = waivRatioPerRshare(post, waivUsdRate);

  const value = vote.rshares * ratio + vote.rsharesWaiv * waivRatio;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function isUpvote(percent: number | null, rshares: number): boolean {
  return (percent ?? 0) > 0 || rshares > 0;
}

export function isDownvote(percent: number | null): boolean {
  return (percent ?? 0) < 0;
}

import type { Post, Thread } from '@opden-data-layer/core';

import type { VoteValuePostContext } from './calculate-vote-value-usd';

export function buildVoteValueContextFromPost(
  post: Post,
  totalHiveRsharesSum: number,
  totalWaivRsharesSum: number,
): VoteValuePostContext {
  return {
    pendingPayoutValue: post.pending_payout_value ?? '',
    totalPayoutValue: post.total_payout_value ?? '',
    curatorPayoutValue: post.curator_payout_value ?? '',
    cashoutTime: post.cashout_time,
    totalPayoutWaiv: post.total_payout_waiv ?? 0,
    totalRewardsWaiv: post.total_rewards_waiv ?? 0,
    netRsharesWaiv: post.net_rshares_waiv ?? 0,
    totalHiveRsharesSum,
    totalWaivRsharesSum,
  };
}

export function buildVoteValueContextFromThread(
  thread: Thread,
  totalHiveRsharesSum: number,
  totalWaivRsharesSum: number,
): VoteValuePostContext {
  return {
    pendingPayoutValue: thread.pending_payout_value ?? '',
    totalPayoutValue: thread.total_payout_value ?? '',
    curatorPayoutValue: '',
    cashoutTime: thread.cashout_time,
    totalPayoutWaiv: 0,
    totalRewardsWaiv: 0,
    netRsharesWaiv: 0,
    totalHiveRsharesSum,
    totalWaivRsharesSum,
  };
}

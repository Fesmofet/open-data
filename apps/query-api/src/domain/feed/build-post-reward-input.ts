import type { HiveContentType } from '@opden-data-layer/clients';
import type { Post } from '@opden-data-layer/core';

import { parsePayoutAmount } from './calculate-post-reward-usd';
import type { PostRewardInput } from './post-reward.types';

function mapBeneficiaries(
  beneficiaries: Post['beneficiaries'] | HiveContentType['beneficiaries'],
): PostRewardInput['beneficiaries'] {
  if (!Array.isArray(beneficiaries)) {
    return [];
  }
  return beneficiaries.map((b) => ({
    account: b.account ?? '',
    weight: typeof b.weight === 'number' ? b.weight : Number(b.weight) || 0,
  }));
}

export function buildPostRewardInputFromPostRow(post: Post): PostRewardInput {
  return {
    pendingPayoutValue: post.pending_payout_value ?? '',
    totalPayoutValue: post.total_payout_value ?? '',
    curatorPayoutValue: post.curator_payout_value ?? '',
    maxAcceptedPayout: post.max_accepted_payout ?? '',
    cashoutTime: post.cashout_time,
    percentHbd: post.percent_steem_dollars,
    promoted: post.promoted,
    totalPayoutWaiv: post.total_payout_waiv ?? 0,
    totalRewardsWaiv: post.total_rewards_waiv ?? 0,
    beneficiaries: mapBeneficiaries(post.beneficiaries),
    jsonMetadata: post.json_metadata,
  };
}

function hivePendingPayoutValue(content: HiveContentType): string {
  const pending = content.pending_payout_value ?? '';
  if (parsePayoutAmount(pending) > 0) {
    return pending;
  }
  const totalPending = content.total_pending_payout_value ?? '';
  if (parsePayoutAmount(totalPending) > 0) {
    return totalPending;
  }
  return pending || totalPending;
}

function preferNonemptyPayout(hive: string, post: string): string {
  if (parsePayoutAmount(hive) > 0) {
    return hive;
  }
  if (parsePayoutAmount(post) > 0) {
    return post;
  }
  return hive.trim() !== '' ? hive : post;
}

export function buildPostRewardInputFromHiveContent(content: HiveContentType): PostRewardInput {
  return {
    pendingPayoutValue: hivePendingPayoutValue(content),
    totalPayoutValue: content.total_payout_value ?? '',
    curatorPayoutValue: content.curator_payout_value ?? '',
    maxAcceptedPayout: content.max_accepted_payout ?? '',
    cashoutTime: content.cashout_time ?? null,
    percentHbd: content.percent_hbd,
    promoted: content.promoted,
    totalPayoutWaiv: 0,
    totalRewardsWaiv: 0,
    beneficiaries: mapBeneficiaries(content.beneficiaries),
    jsonMetadata: content.json_metadata,
  };
}

export function mergeWaivFieldsIntoRewardInput(
  input: PostRewardInput,
  waiv: { totalPayoutWaiv?: number; totalRewardsWaiv?: number },
): PostRewardInput {
  return {
    ...input,
    totalPayoutWaiv: waiv.totalPayoutWaiv ?? input.totalPayoutWaiv,
    totalRewardsWaiv: waiv.totalRewardsWaiv ?? input.totalRewardsWaiv,
  };
}

/** Merges Hive discussion/comment node with ODL `posts` row (WAIV + fresher Hive fields). */
export function buildPostRewardInputFromSources(
  hiveContent: HiveContentType | undefined,
  post: Post | undefined,
): PostRewardInput {
  if (!hiveContent && !post) {
    return buildPostRewardInputFromHiveContent({} as HiveContentType);
  }
  const fromHive = hiveContent
    ? buildPostRewardInputFromHiveContent(hiveContent)
    : null;
  if (!post) {
    return fromHive!;
  }
  const fromPost = buildPostRewardInputFromPostRow(post);
  if (!fromHive) {
    return fromPost;
  }
  return {
    ...fromPost,
    pendingPayoutValue: preferNonemptyPayout(
      fromHive.pendingPayoutValue,
      fromPost.pendingPayoutValue,
    ),
    totalPayoutValue: preferNonemptyPayout(
      fromHive.totalPayoutValue,
      fromPost.totalPayoutValue,
    ),
    curatorPayoutValue: preferNonemptyPayout(
      fromHive.curatorPayoutValue,
      fromPost.curatorPayoutValue,
    ),
    maxAcceptedPayout:
      parsePayoutAmount(fromHive.maxAcceptedPayout) > 0
        ? fromHive.maxAcceptedPayout
        : fromPost.maxAcceptedPayout,
    cashoutTime: fromHive.cashoutTime ?? fromPost.cashoutTime,
    percentHbd: fromHive.percentHbd ?? fromPost.percentHbd,
    promoted: preferNonemptyPayout(
      fromHive.promoted ?? '',
      fromPost.promoted ?? '',
    ),
    beneficiaries:
      fromHive.beneficiaries.length > 0
        ? fromHive.beneficiaries
        : fromPost.beneficiaries,
    jsonMetadata: fromPost.jsonMetadata ?? fromHive.jsonMetadata,
    totalPayoutWaiv: fromPost.totalPayoutWaiv,
    totalRewardsWaiv: fromPost.totalRewardsWaiv,
  };
}

import type { HiveContentType } from '@opden-data-layer/clients';
import type { Post } from '@opden-data-layer/core';

import type { HivePayoutFieldUpdate } from '../../repositories/posts.repository';

function toBigIntVoteRshares(v: number | string | undefined | null): bigint {
  if (v === undefined || v === null) {
    return BigInt(0);
  }
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) {
    return BigInt(0);
  }
  return BigInt(Math.trunc(n));
}

type PostPayoutFallback = Pick<
  Post,
  | 'pending_payout_value'
  | 'total_payout_value'
  | 'curator_payout_value'
  | 'total_pending_payout_value'
  | 'cashout_time'
  | 'last_payout'
  | 'total_vote_weight'
>;

/** Maps Hive `getContent` fields to ODL `posts` payout columns (scheduler reconcile parity). */
export function hivePayoutFieldsFromContent(
  hive: HiveContentType,
  post?: PostPayoutFallback,
): HivePayoutFieldUpdate {
  return {
    pending_payout_value:
      hive.pending_payout_value ?? post?.pending_payout_value,
    total_payout_value: hive.total_payout_value ?? post?.total_payout_value,
    curator_payout_value:
      hive.curator_payout_value ?? post?.curator_payout_value,
    total_pending_payout_value:
      hive.total_pending_payout_value ?? post?.total_pending_payout_value,
    cashout_time: hive.cashout_time ?? post?.cashout_time ?? null,
    last_payout: hive.last_payout ?? post?.last_payout ?? null,
    net_rshares: toBigIntVoteRshares(hive.net_rshares),
    total_vote_weight:
      hive.total_vote_weight !== undefined && hive.total_vote_weight !== null
        ? BigInt(Math.trunc(hive.total_vote_weight))
        : post?.total_vote_weight ?? null,
  };
}

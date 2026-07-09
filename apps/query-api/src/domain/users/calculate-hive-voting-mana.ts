import { HIVE_VOTE_REGENERATION_SEC } from '@opden-data-layer/core';
import type { HiveAccountWalletFields } from '@opden-data-layer/clients';

const MAX_VP = 10_000;

function parseAssetNumber(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Effective Hive voting power percent (0–100) from `voting_power` + `last_vote_time`. */
export function calculateHiveUpvotingManaPercent(
  account: Pick<HiveAccountWalletFields, 'voting_power' | 'last_vote_time'>,
  nowMs = Date.now(),
): number {
  const baseVp = account.voting_power ?? MAX_VP;
  const lastVote = account.last_vote_time?.trim();
  if (!lastVote) {
    return roundPercent(baseVp / 100);
  }
  const lastMs = Date.parse(`${lastVote}Z`);
  if (!Number.isFinite(lastMs)) {
    return roundPercent(baseVp / 100);
  }
  const secondsAgo = (nowMs - lastMs) / 1000;
  const effectiveVp = Math.min(
    MAX_VP,
    baseVp + (MAX_VP * secondsAgo) / HIVE_VOTE_REGENERATION_SEC,
  );
  return roundPercent(effectiveVp / 100);
}

/** Legacy `calculateDownVote` from waivio-frontend `steemitHelpers.js`. */
export function calculateHiveDownvotingManaPercent(
  account: Pick<
    HiveAccountWalletFields,
    'voting_manabar' | 'downvote_manabar' | 'voting_power'
  >,
  upvotingManaPercent: number,
  nowMs = Date.now(),
): number {
  const currentMana = parseManabarNumber(account.voting_manabar?.current_mana);
  const downvoteMana = parseManabarNumber(account.downvote_manabar?.current_mana);
  const downvoteUpdate = account.downvote_manabar?.last_update_time;

  if (currentMana > 0 && downvoteMana > 0 && downvoteUpdate != null) {
    const votingManaRatio =
      upvotingManaPercent > 0 ? upvotingManaPercent / 100 : 0.01;
    const downvotePer = downvoteMana / (currentMana / votingManaRatio / 4);
    const secondsAgo = (nowMs - downvoteUpdate * 1000) / 1000;
    const pow = Math.min(
      (downvotePer * 100 + (MAX_VP * secondsAgo) / HIVE_VOTE_REGENERATION_SEC) /
        100,
      100,
    );
    return roundPercent(pow);
  }

  return 100;
}

function parseManabarNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function netVestingShares(
  account: Partial<
    Pick<
      HiveAccountWalletFields,
      'vesting_shares' | 'received_vesting_shares' | 'delegated_vesting_shares'
    >
  >,
): number {
  return (
    parseAssetNumber(account.vesting_shares) +
    parseAssetNumber(account.received_vesting_shares) -
    parseAssetNumber(account.delegated_vesting_shares)
  );
}

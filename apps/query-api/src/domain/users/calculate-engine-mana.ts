import type { HiveEngineVotingPower } from '@opden-data-layer/clients';
import {
  ENGINE_DOWNVOTE_REGENERATION_DAYS,
  ENGINE_VOTE_REGENERATION_DAYS,
  MAX_VOTING_POWER,
} from '@opden-data-layer/core';

const MS_PER_DAY = 24 * 3600 * 1000;

export type EngineManaPercent = {
  upvotingManaPercent: number;
  downvotingManaPercent: number;
};

/**
 * Regenerates Hive Engine voting mana (legacy `engineOperations.calculateMana`).
 * Returns percentages in 0–100 range.
 */
export function calculateEngineManaPercent(
  votingPower: HiveEngineVotingPower | null | undefined,
  nowMs = Date.now(),
): EngineManaPercent {
  const base = votingPower ?? {
    votingPower: MAX_VOTING_POWER,
    downvotingPower: MAX_VOTING_POWER,
    lastVoteTimestamp: nowMs,
  };

  let up = base.votingPower;
  let down = base.downvotingPower;
  const elapsed = nowMs - base.lastVoteTimestamp;

  up +=
    (elapsed * MAX_VOTING_POWER) / (ENGINE_VOTE_REGENERATION_DAYS * MS_PER_DAY);
  down +=
    (elapsed * MAX_VOTING_POWER) /
    (ENGINE_DOWNVOTE_REGENERATION_DAYS * MS_PER_DAY);

  up = Math.min(Math.floor(up), MAX_VOTING_POWER);
  down = Math.min(Math.floor(down), MAX_VOTING_POWER);

  return {
    upvotingManaPercent: roundPercent(up * 0.01),
    downvotingManaPercent: roundPercent(down * 0.01),
  };
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

import type { GovernanceSnapshot } from '../types/governance-snapshot';
import type { ResolvedUpdate } from '../types/resolved-view';
import type { VoterWaivPowerMap } from '../types/aggregated-object';
import { ObjectOwnership, RankVote } from '@opden-data-layer/odl-db-types';
import { computeExclusiveOwnerSet } from './compute-exclusive-owner-set';

export function waivVoteWeight(waivPower: number): number {
  return waivPower > 1 ? waivPower : 1;
}

/**
 * Persisted rank metadata for one update row (indexer calls this after each rank_vote).
 *
 * Winner mode: when E is nonempty, only E rank votes are decisive; other admin/trusted ranks
 * are ignored. When E is nonempty and no E rank exists, community rank applies.
 * Average mode: all rank votes participate (exclusive does not filter).
 */
export function computeUpdateRankPersistence(
  rankVotes: RankVote[],
  governance: GovernanceSnapshot,
  voterWaivPowers: VoterWaivPowerMap,
  rankAggregation: 'average' | 'winner' | undefined,
  ownerships: ObjectOwnership[] = [],
): {
  rank_score: number | null;
  rank_context: string | null;
  rank_decisive_event_seq: bigint | null;
} {
  if (rankVotes.length === 0) {
    return { rank_score: null, rank_context: null, rank_decisive_event_seq: null };
  }

  const mode = rankAggregation === 'average' ? 'average' : 'winner';

  if (mode === 'average') {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const v of rankVotes) {
      const w = waivVoteWeight(voterWaivPowers.get(v.voter) ?? 0);
      weightedSum += v.rank * w;
      weightTotal += w;
    }
    if (weightTotal === 0) {
      return { rank_score: null, rank_context: null, rank_decisive_event_seq: null };
    }
    return {
      rank_score: Math.round(weightedSum / weightTotal),
      rank_context: null,
      rank_decisive_event_seq: null,
    };
  }

  const exclusiveSet = computeExclusiveOwnerSet(ownerships, governance);
  const adminSet = new Set(governance.admins);
  const trustedSet = new Set(governance.trusted);
  const communityVotes = rankVotes.filter(
    (v) => !adminSet.has(v.voter) && !trustedSet.has(v.voter),
  );

  if (exclusiveSet.size > 0) {
    const exclusiveVotes = rankVotes.filter((v) => exclusiveSet.has(v.voter));
    if (exclusiveVotes.length > 0) {
      const latest = latestRankVote(exclusiveVotes);
      return {
        rank_score: latest.rank,
        rank_context: latest.rank_context,
        rank_decisive_event_seq: latest.event_seq,
      };
    }
    return computeCommunityWinnerRank(communityVotes, voterWaivPowers);
  }

  const adminVotes = rankVotes.filter((v) => governance.admins.includes(v.voter));
  if (adminVotes.length > 0) {
    const latest = latestRankVote(adminVotes);
    return {
      rank_score: latest.rank,
      rank_context: latest.rank_context,
      rank_decisive_event_seq: latest.event_seq,
    };
  }

  const trustedVotes = rankVotes.filter((v) => governance.trusted.includes(v.voter));
  if (trustedVotes.length > 0) {
    const latest = latestRankVote(trustedVotes);
    return {
      rank_score: latest.rank,
      rank_context: latest.rank_context,
      rank_decisive_event_seq: latest.event_seq,
    };
  }

  return computeCommunityWinnerRank(communityVotes, voterWaivPowers);
}

function computeCommunityWinnerRank(
  communityVotes: RankVote[],
  voterWaivPowers: VoterWaivPowerMap,
): {
  rank_score: number | null;
  rank_context: string | null;
  rank_decisive_event_seq: bigint | null;
} {
  if (communityVotes.length === 0) {
    return { rank_score: null, rank_context: null, rank_decisive_event_seq: null };
  }

  const maxPower = Math.max(...communityVotes.map((v) => voterWaivPowers.get(v.voter) ?? 0));
  const candidates = communityVotes.filter(
    (v) => (voterWaivPowers.get(v.voter) ?? 0) === maxPower,
  );
  const best = candidates.reduce((a, v) => (v.event_seq > a.event_seq ? v : a));
  return {
    rank_score: best.rank,
    rank_context: best.rank_context,
    rank_decisive_event_seq: best.event_seq,
  };
}

/**
 * Sort key for multi-cardinality ordering using persisted rank fields on {@link ResolvedUpdate}.
 *
 * Tie-break order:
 *   1. rank_score ASC (nulls last)
 *   2. rank_decisive_event_seq DESC
 *   3. update event_seq DESC
 *   4. update_id ASC
 *
 * @see docs/spec/vote-semantics.md §B
 */
export function compareResolvedUpdatesByRanking(
  a: ResolvedUpdate,
  b: ResolvedUpdate,
): number {
  const aScore = a.rank_score;
  const bScore = b.rank_score;

  if (aScore !== null && bScore === null) return -1;
  if (aScore === null && bScore !== null) return 1;
  if (aScore !== null && bScore !== null && aScore !== bScore) return aScore - bScore;

  const aSeq = a.rank_decisive_event_seq;
  const bSeq = b.rank_decisive_event_seq;
  if (aSeq !== null && bSeq === null) return -1;
  if (aSeq === null && bSeq !== null) return 1;
  if (aSeq !== null && bSeq !== null && aSeq !== bSeq) {
    return aSeq > bSeq ? -1 : 1;
  }

  if (a.event_seq !== b.event_seq) {
    return a.event_seq > b.event_seq ? -1 : 1;
  }

  return a.update_id < b.update_id ? -1 : 1;
}

function latestRankVote(votes: RankVote[]): RankVote {
  return votes.reduce((best, v) => (v.event_seq > best.event_seq ? v : best));
}

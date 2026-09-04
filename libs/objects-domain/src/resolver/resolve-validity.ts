import { MIN_PERCENT_TO_SHOW_UPDATE } from '../constants';
import type { GovernanceSnapshot } from '../types/governance-snapshot';
import type { ValidityStatus, ValidityTier, VoterWaivPowerMap } from '../types';
import { waivVoteWeight } from './resolve-ranking';
import { ObjectUpdate, ValidityVote, ObjectOwnership } from '@opden-data-layer/odl-db-types';
import {
  computeExclusiveOwnerSet,
} from './compute-exclusive-owner-set';

export { computeCuratorSet, computeExclusiveOwnerSet } from './compute-exclusive-owner-set';

/** Result of {@link resolveUpdateValidity} including tier metadata for single-cardinality ordering. */
export type ResolveUpdateValidityResult = {
  status: ValidityStatus;
  field_weight: number | null;
  approve_percent: number;
  validity_tier: ValidityTier | null;
  decisive_vote_event_seq: bigint | null;
  /** Voter of the decisive admin/trusted validity vote when applicable. */
  decisive_voter: string | null;
  /** Vote value of the decisive admin/trusted validity vote when applicable. */
  decisive_vote: 'for' | 'against' | null;
};

/**
 * Display / consensus approval percentage for one update (0–100, up to 3 decimals).
 * Reusable for list UI and for validity resolution.
 *
 * When E is nonempty, only E votes are decisive (100/0); other admin/trusted votes are ignored.
 * When E is nonempty and no E vote exists, falls through to community / baseline 100.
 * When E is empty: admin LWAW → trusted LWTW → community weights → baseline 100.
 */
export function computeApprovePercent(
  update: ObjectUpdate,
  validityVotes: ValidityVote[],
  governance: GovernanceSnapshot,
  voterWaivPowers: VoterWaivPowerMap,
  ownerships: ObjectOwnership[],
): number {
  const updateVotes = validityVotes.filter((v) => v.update_id === update.update_id);
  const exclusiveSet = computeExclusiveOwnerSet(ownerships, governance);
  const adminSet = new Set(governance.admins);
  const trustedSet = new Set(governance.trusted);
  const communityVotes = updateVotes.filter(
    (v) => !adminSet.has(v.voter) && !trustedSet.has(v.voter),
  );

  if (exclusiveSet.size > 0) {
    const exclusiveVotes = updateVotes.filter((v) => exclusiveSet.has(v.voter));
    if (exclusiveVotes.length > 0) {
      const latest = latestByEventSeq(exclusiveVotes);
      return latest.vote === 'for' ? 100 : 0;
    }
    return computeCommunityApprovePercent(communityVotes, voterWaivPowers);
  }

  const adminVotes = updateVotes.filter((v) => governance.admins.includes(v.voter));
  if (adminVotes.length > 0) {
    const latest = latestByEventSeq(adminVotes);
    return latest.vote === 'for' ? 100 : 0;
  }

  const accountsWithAuthority = new Set(ownerships.map((o) => o.account));
  const trustedWithAuthority = governance.trusted.filter((t) => accountsWithAuthority.has(t));
  const trustedVotes = updateVotes.filter((v) => trustedWithAuthority.includes(v.voter));
  if (trustedVotes.length > 0) {
    const latest = latestByEventSeq(trustedVotes);
    return latest.vote === 'for' ? 100 : 0;
  }

  return computeCommunityApprovePercent(communityVotes, voterWaivPowers);
}

function computeCommunityApprovePercent(
  communityVotes: ValidityVote[],
  voterWaivPowers: VoterWaivPowerMap,
): number {
  if (communityVotes.length === 0) {
    return 100;
  }

  let for_weight = 0;
  let against_weight = 0;
  for (const vote of communityVotes) {
    const w = waivVoteWeight(voterWaivPowers.get(vote.voter) ?? 0);
    if (vote.vote === 'for') {
      for_weight += w;
    } else {
      against_weight += w;
    }
  }

  const net = for_weight - against_weight;
  if (net <= 0) {
    return 0;
  }
  if (against_weight === 0) {
    return 100;
  }
  return Math.round((for_weight / (for_weight + against_weight)) * 100 * 1000) / 1000;
}

/**
 * Resolve the validity status of a single update using the tiered hierarchy.
 *
 * Hierarchy (with non-empty curator set):
 *   Curator filter — valid only if creator ∈ C OR any C member voted 'for'.
 *   `approve_percent` is computed for display and matches {@link computeApprovePercent}.
 *
 * Hierarchy (empty curator set):
 *   1. Admin decisive vote (LWAW)
 *   2. Trusted decisive vote on objects they have authority over (LWTW)
 *   3. Community vote weight: field_weight = Σ(weight × sign); show iff approve_percent > MIN_PERCENT_TO_SHOW_UPDATE
 *   4. No community votes → baseline VALID (approve_percent 100 from {@link computeApprovePercent})
 *
 * @see docs/spec/data-model/flow.md §Step 4
 * @see docs/spec/vote-semantics.md §A and §C
 */
export function resolveUpdateValidity(
  update: ObjectUpdate,
  validityVotes: ValidityVote[],
  curatorSet: Set<string>,
  governance: GovernanceSnapshot,
  voterWaivPowers: VoterWaivPowerMap,
  ownerships: ObjectOwnership[],
): ResolveUpdateValidityResult {
  const approve_percent = computeApprovePercent(
    update,
    validityVotes,
    governance,
    voterWaivPowers,
    ownerships,
  );

  if (curatorSet.size > 0) {
    const { status, field_weight } = resolveCuratorFilter(update, validityVotes, curatorSet);
    return {
      status,
      field_weight,
      approve_percent,
      validity_tier: null,
      decisive_vote_event_seq: null,
      decisive_voter: null,
      decisive_vote: null,
    };
  }

  return resolveHierarchy(
    update,
    validityVotes,
    governance,
    voterWaivPowers,
    ownerships,
    approve_percent,
  );
}

function resolveCuratorFilter(
  update: ObjectUpdate,
  validityVotes: ValidityVote[],
  exclusiveSet: Set<string>,
): { status: ValidityStatus; field_weight: null } {
  const exclusiveVotes = validityVotes.filter(
    (v) => v.update_id === update.update_id && exclusiveSet.has(v.voter),
  );

  if (exclusiveVotes.length > 0) {
    const latest = latestByEventSeq(exclusiveVotes);
    return { status: latest.vote === 'for' ? 'VALID' : 'REJECTED', field_weight: null };
  }

  if (exclusiveSet.has(update.creator)) {
    return { status: 'VALID', field_weight: null };
  }

  return { status: 'REJECTED', field_weight: null };
}

function resolveHierarchy(
  update: ObjectUpdate,
  validityVotes: ValidityVote[],
  governance: GovernanceSnapshot,
  voterWaivPowers: VoterWaivPowerMap,
  ownerships: ObjectOwnership[],
  approve_percent: number,
): ResolveUpdateValidityResult {
  const updateVotes = validityVotes.filter((v) => v.update_id === update.update_id);

  const adminVotes = updateVotes.filter((v) => governance.admins.includes(v.voter));
  if (adminVotes.length > 0) {
    const latest = latestByEventSeq(adminVotes);
    return {
      status: latest.vote === 'for' ? 'VALID' : 'REJECTED',
      field_weight: null,
      approve_percent,
      validity_tier: 'admin',
      decisive_vote_event_seq: latest.event_seq,
      decisive_voter: latest.voter,
      decisive_vote: latest.vote,
    };
  }

  const accountsWithAuthority = new Set(ownerships.map((o) => o.account));
  const trustedWithAuthority = governance.trusted.filter((t) => accountsWithAuthority.has(t));
  const trustedVotes = updateVotes.filter((v) => trustedWithAuthority.includes(v.voter));
  if (trustedVotes.length > 0) {
    const latest = latestByEventSeq(trustedVotes);
    return {
      status: latest.vote === 'for' ? 'VALID' : 'REJECTED',
      field_weight: null,
      approve_percent,
      validity_tier: 'trusted',
      decisive_vote_event_seq: latest.event_seq,
      decisive_voter: latest.voter,
      decisive_vote: latest.vote,
    };
  }

  const adminSet = new Set(governance.admins);
  const trustedSet = new Set(governance.trusted);
  const communityVotes = updateVotes.filter(
    (v) => !adminSet.has(v.voter) && !trustedSet.has(v.voter),
  );
  if (communityVotes.length === 0) {
    return {
      status: 'VALID',
      field_weight: null,
      approve_percent,
      validity_tier: 'baseline',
      decisive_vote_event_seq: null,
      decisive_voter: null,
      decisive_vote: null,
    };
  }

  let field_weight = 0;
  for (const vote of communityVotes) {
    const weight = waivVoteWeight(voterWaivPowers.get(vote.voter) ?? 0);
    const sign = vote.vote === 'for' ? 1 : -1;
    field_weight += weight * sign;
  }
  return {
    status: approve_percent > MIN_PERCENT_TO_SHOW_UPDATE ? 'VALID' : 'REJECTED',
    field_weight,
    approve_percent,
    validity_tier: 'community',
    decisive_vote_event_seq: null,
    decisive_voter: null,
    decisive_vote: null,
  };
}

function latestByEventSeq(votes: ValidityVote[]): ValidityVote {
  return votes.reduce((best, v) => (v.event_seq > best.event_seq ? v : best));
}

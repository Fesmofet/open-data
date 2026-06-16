import type { ValidityVote } from '@opden-data-layer/core';

export const VALIDITY_VOTE_PREVIEW_LIMIT = 3;
export const VALIDITY_VOTER_LIST_LIMIT = 100;

export type ResolvedValidityVoterEntry = {
  voter: string;
  event_seq: bigint;
};

export type ResolvedValidityVoters = {
  forVoters: ResolvedValidityVoterEntry[];
  againstVoters: ResolvedValidityVoterEntry[];
};

type LatestVote = {
  vote: 'for' | 'against';
  event_seq: bigint;
};

/** Latest validity vote per voter (max `event_seq` wins). */
export function resolveLatestValidityVoters(
  votes: readonly ValidityVote[],
): ResolvedValidityVoters {
  const latestByVoter = new Map<string, LatestVote>();
  for (const row of votes) {
    const existing = latestByVoter.get(row.voter);
    if (!existing || row.event_seq > existing.event_seq) {
      latestByVoter.set(row.voter, { vote: row.vote, event_seq: row.event_seq });
    }
  }

  const forEntries: Array<{ voter: string; event_seq: bigint }> = [];
  const againstEntries: Array<{ voter: string; event_seq: bigint }> = [];
  for (const [voter, latest] of latestByVoter) {
    if (latest.vote === 'for') {
      forEntries.push({ voter, event_seq: latest.event_seq });
    } else {
      againstEntries.push({ voter, event_seq: latest.event_seq });
    }
  }

  const byRecency = (
    a: { voter: string; event_seq: bigint },
    b: { voter: string; event_seq: bigint },
  ) => {
    if (a.event_seq > b.event_seq) return -1;
    if (a.event_seq < b.event_seq) return 1;
    return a.voter.localeCompare(b.voter);
  };

  forEntries.sort(byRecency);
  againstEntries.sort(byRecency);

  return {
    forVoters: forEntries,
    againstVoters: againstEntries,
  };
}

export function previewValidityVoters(
  voters: readonly string[],
  limit = VALIDITY_VOTE_PREVIEW_LIMIT,
): string[] {
  return voters.slice(0, limit);
}

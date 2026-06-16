import type { ValidityVote } from '@opden-data-layer/core';

import {
  previewValidityVoters,
  resolveLatestValidityVoters,
} from './resolve-latest-validity-votes';

function validityVote(
  voter: string,
  voteValue: 'for' | 'against',
  event_seq: number,
): ValidityVote {
  return {
    update_id: 'u1',
    object_id: 'obj1',
    voter,
    vote: voteValue,
    event_seq: BigInt(event_seq),
    transaction_id: `tx-${event_seq}`,
  };
}

describe('resolveLatestValidityVoters', () => {
  it('returns empty lists when no votes', () => {
    expect(resolveLatestValidityVoters([])).toEqual({
      forVoters: [],
      againstVoters: [],
    });
  });

  it('splits voters by latest vote direction', () => {
    expect(
      resolveLatestValidityVoters([
        validityVote('alice', 'for', 1),
        validityVote('bob', 'against', 2),
      ]),
    ).toEqual({
      forVoters: [{ voter: 'alice', event_seq: BigInt(1) }],
      againstVoters: [{ voter: 'bob', event_seq: BigInt(2) }],
    });
  });

  it('uses latest event_seq when a voter switches sides', () => {
    expect(
      resolveLatestValidityVoters([
        validityVote('alice', 'for', 1),
        validityVote('alice', 'against', 5),
        validityVote('bob', 'against', 2),
        validityVote('bob', 'for', 4),
      ]),
    ).toEqual({
      forVoters: [{ voter: 'bob', event_seq: BigInt(4) }],
      againstVoters: [{ voter: 'alice', event_seq: BigInt(5) }],
    });
  });

  it('sorts by most recent vote first', () => {
    expect(
      resolveLatestValidityVoters([
        validityVote('alice', 'for', 1),
        validityVote('carol', 'for', 3),
        validityVote('bob', 'for', 2),
      ]).forVoters,
    ).toEqual([
      { voter: 'carol', event_seq: BigInt(3) },
      { voter: 'bob', event_seq: BigInt(2) },
      { voter: 'alice', event_seq: BigInt(1) },
    ]);
  });
});

describe('previewValidityVoters', () => {
  it('caps preview list length', () => {
    expect(previewValidityVoters(['a', 'b', 'c', 'd'], 3)).toEqual(['a', 'b', 'c']);
  });
});

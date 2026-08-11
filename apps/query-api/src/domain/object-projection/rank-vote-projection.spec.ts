import { buildRankVoteProjection } from './rank-vote-projection';

describe('buildRankVoteProjection', () => {
  it('coerces vote count bigint and string', () => {
    const result = buildRankVoteProjection(
      [
        { update_id: 'u1', n: BigInt(3) },
        { update_id: 'u2', n: '5' },
      ],
      [],
    );
    expect(result.countByUpdateId.get('u1')).toBe(3);
    expect(result.countByUpdateId.get('u2')).toBe(5);
  });

  it('picks viewer rank with latest event_seq', () => {
    const result = buildRankVoteProjection(
      [],
      [
        { update_id: 'u1', rank: 3000, event_seq: BigInt(10) },
        { update_id: 'u1', rank: 9000, event_seq: BigInt(20) },
        { update_id: 'u1', rank: 5000, event_seq: BigInt(15) },
      ],
    );
    expect(result.viewerRankByUpdateId.get('u1')).toBe(9000);
  });

  it('returns empty maps when no rows', () => {
    const result = buildRankVoteProjection([], []);
    expect(result.countByUpdateId.size).toBe(0);
    expect(result.viewerRankByUpdateId.size).toBe(0);
  });
});

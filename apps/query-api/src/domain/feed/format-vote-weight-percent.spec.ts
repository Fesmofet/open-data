import { formatVoteWeightPercent } from './format-vote-weight-percent';

describe('formatVoteWeightPercent', () => {
  it('uses integer Hive basis-point weight', () => {
    expect(formatVoteWeightPercent(10000, null)).toBe(100);
    expect(formatVoteWeightPercent(5000, null)).toBe(50);
    expect(formatVoteWeightPercent(1500, null)).toBe(15);
    expect(formatVoteWeightPercent(100, null)).toBe(1);
  });

  it('uses indexer percent scale (hiveWeight / 100 stored as percent)', () => {
    expect(formatVoteWeightPercent(null, 100)).toBe(100);
    expect(formatVoteWeightPercent(null, 70)).toBe(70);
    expect(formatVoteWeightPercent(10000, 100)).toBe(100);
  });

  it('uses integer Hive percent from get_active_votes sync', () => {
    expect(formatVoteWeightPercent(null, 10000)).toBe(100);
    expect(formatVoteWeightPercent(null, 7000)).toBe(70);
    expect(formatVoteWeightPercent(100, 100)).toBe(1);
  });

  it('ignores fractional weight from rshares fallback', () => {
    expect(formatVoteWeightPercent(0.293751164362827, null)).toBe(0);
    expect(formatVoteWeightPercent(0.293751164362827, 29)).toBe(0.29);
    expect(formatVoteWeightPercent(5024706801750, null)).toBe(0);
    expect(formatVoteWeightPercent(5024706801750, 10000)).toBe(100);
  });

  it('floors tiny nonzero votes to 0.01%', () => {
    expect(formatVoteWeightPercent(1, null)).toBe(0.01);
  });
});

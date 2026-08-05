import { formatHiveReputation } from './format-hive-reputation';
import { getHiveReputationRankKey } from './get-hive-reputation-rank';

describe('formatHiveReputation', () => {
  it('returns 25 for zero reputation', () => {
    expect(formatHiveReputation(0)).toBe(25);
  });

  it('formats positive chain reputation', () => {
    expect(formatHiveReputation(1_234_567_890)).toBeGreaterThan(25);
  });
});

describe('getHiveReputationRankKey', () => {
  it('returns minnow for mid reputation', () => {
    expect(getHiveReputationRankKey(30)).toBe('rank_minnow');
  });

  it('returns whale for high reputation', () => {
    expect(getHiveReputationRankKey(80)).toBe('rank_whale');
  });
});

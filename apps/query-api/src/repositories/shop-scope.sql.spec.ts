import { shopRatingThresholdToRank } from '../domain/shop/shop.constants';

describe('shop-scope.sql rating filter', () => {
  it('maps legacy threshold 6 to rank_score 6000 (5★ object passes rating=6 filter)', () => {
    expect(shopRatingThresholdToRank(6)).toBe(6000);
    expect(shopRatingThresholdToRank(8)).toBe(8000);
    expect(shopRatingThresholdToRank(10)).toBe(10000);
  });
});

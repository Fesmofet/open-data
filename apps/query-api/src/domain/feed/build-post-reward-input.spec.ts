import type { HiveContentType } from '@opden-data-layer/clients';
import type { Post } from '@opden-data-layer/core';

import { calculatePostRewardUsd } from './calculate-post-reward-usd';
import {
  buildPostRewardInputFromHiveContent,
  buildPostRewardInputFromSources,
} from './build-post-reward-input';

describe('buildPostRewardInputFromHiveContent', () => {
  it('falls back to total_pending_payout_value when pending is zero', () => {
    const input = buildPostRewardInputFromHiveContent({
      pending_payout_value: '0.000 HBD',
      total_pending_payout_value: '1.250 HBD',
      total_payout_value: '0.000 HBD',
      curator_payout_value: '0.000 HBD',
      max_accepted_payout: '1000000.000 HBD',
      cashout_time: '2099-01-01T00:00:00',
      percent_hbd: 10000,
    } as HiveContentType);

    const usd = calculatePostRewardUsd(input, 0);
    expect(usd?.potentialUsd).toBe(1.25);
  });
});

describe('buildPostRewardInputFromSources', () => {
  it('merges ODL post row payouts when Hive node omits pending', () => {
    const post = {
      author: 'bob',
      permlink: 'c1',
      pending_payout_value: '2.000 HBD',
      total_payout_value: '0.000 HBD',
      curator_payout_value: '0.000 HBD',
      max_accepted_payout: '1000000.000 HBD',
      cashout_time: '2099-01-01T00:00:00',
      percent_steem_dollars: 10000,
      promoted: '0.000 HBD',
      total_payout_waiv: 0,
      total_rewards_waiv: 0,
      beneficiaries: [],
      json_metadata: '{"tags":["waivio"]}',
    } as Post;

    const input = buildPostRewardInputFromSources(
      {
        author: 'bob',
        permlink: 'c1',
        pending_payout_value: '0.000 HBD',
        total_pending_payout_value: '0.000 HBD',
      } as HiveContentType,
      post,
    );

    const usd = calculatePostRewardUsd(input, 0);
    expect(usd?.potentialUsd).toBe(2);
    expect(input.totalPayoutWaiv).toBe(0);
  });
});

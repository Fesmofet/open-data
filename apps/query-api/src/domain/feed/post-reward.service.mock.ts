import type { SupportedCurrency } from '@opden-data-layer/core';

import { isWaivRewardEligible } from './post-reward-eligibility';
import type { PostRewardInput } from './post-reward.types';
import type { PostRewardService } from './post-reward.service';

/** Test helper: passthrough enrich with null reward. */
export function createPassthroughPostRewardServiceMock(): Pick<
  PostRewardService,
  'enrichFeedItems'
> {
  return {
    enrichFeedItems: async <T extends object>(
      items: T[],
      inputs: PostRewardInput[],
      _currency: SupportedCurrency,
    ) =>
      items.map((item, index) => ({
        ...item,
        reward: null,
        waivRewardEligible: isWaivRewardEligible(inputs[index]?.jsonMetadata),
      })),
  };
}

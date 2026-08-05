export interface VoteLikeNotificationInput {
  voter: string;
  weight: number;
  isRootPost: boolean;
  title: string | null;
  likesCount: number;
  thirdPlaceWeightAmongOthers: number;
  authorFollowsVoter: boolean;
}

export interface VoteLikeNotificationResult {
  title: string | null;
  likesCount: number;
}

const WEIGHT_FILTER_MIN_OTHER_LIKES = 5;

/**
 * Legacy parity with notifications-legacy like parser:
 * skip unvotes, require indexed root post, suppress low-weight votes on posts
 * with many likes unless the author follows the voter.
 */
export function evaluateVoteLikeNotification(
  input: VoteLikeNotificationInput,
): VoteLikeNotificationResult | null {
  if (!input.isRootPost) {
    return null;
  }
  if (input.weight <= 0) {
    return null;
  }

  if (
    input.likesCount > WEIGHT_FILTER_MIN_OTHER_LIKES &&
    !input.authorFollowsVoter &&
    input.weight < input.thirdPlaceWeightAmongOthers
  ) {
    return null;
  }

  return {
    title: input.title,
    likesCount: input.likesCount,
  };
}

export function thirdPlaceWeightFromTopWeights(topWeights: readonly number[]): number {
  return topWeights[2] ?? 0;
}

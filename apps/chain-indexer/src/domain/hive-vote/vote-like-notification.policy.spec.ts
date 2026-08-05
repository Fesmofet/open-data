import {
  evaluateVoteLikeNotification,
  thirdPlaceWeightFromTopWeights,
} from './vote-like-notification.policy';

const baseInput = {
  voter: 'voter1',
  weight: 10_000,
  isRootPost: true,
  title: 'Post title',
  authorFollowsVoter: false,
  thirdPlaceWeightAmongOthers: 0,
};

describe('evaluateVoteLikeNotification', () => {
  it('returns likesCount 0 for the first upvote on a post', () => {
    const result = evaluateVoteLikeNotification({
      ...baseInput,
      likesCount: 0,
    });
    expect(result).toEqual({ title: 'Post title', likesCount: 0 });
  });

  it('returns likesCount 1 when one other voter already liked the post', () => {
    const result = evaluateVoteLikeNotification({
      ...baseInput,
      likesCount: 1,
    });
    expect(result).toEqual({ title: 'Post title', likesCount: 1 });
  });

  it('suppresses unvotes and non-root posts', () => {
    expect(
      evaluateVoteLikeNotification({
        ...baseInput,
        weight: 0,
        likesCount: 0,
      }),
    ).toBeNull();
    expect(
      evaluateVoteLikeNotification({
        ...baseInput,
        isRootPost: false,
        likesCount: 0,
      }),
    ).toBeNull();
  });

  it('suppresses low-weight votes when post has many other likes', () => {
    expect(
      evaluateVoteLikeNotification({
        ...baseInput,
        weight: 1_000,
        likesCount: 6,
        thirdPlaceWeightAmongOthers: 30_000,
      }),
    ).toBeNull();
  });

  it('allows low-weight votes when author follows the voter', () => {
    expect(
      evaluateVoteLikeNotification({
        ...baseInput,
        weight: 1_000,
        likesCount: 6,
        thirdPlaceWeightAmongOthers: 30_000,
        authorFollowsVoter: true,
      }),
    ).toEqual({ title: 'Post title', likesCount: 6 });
  });

  it('allows votes in the top three by weight among existing upvotes', () => {
    expect(
      evaluateVoteLikeNotification({
        ...baseInput,
        weight: 30_000,
        likesCount: 6,
        thirdPlaceWeightAmongOthers: 30_000,
      }),
    ).toEqual({ title: 'Post title', likesCount: 6 });
  });
});

describe('thirdPlaceWeightFromTopWeights', () => {
  it('returns the third weight or zero when fewer than three votes exist', () => {
    expect(thirdPlaceWeightFromTopWeights([50_000, 40_000, 30_000])).toBe(
      30_000,
    );
    expect(thirdPlaceWeightFromTopWeights([50_000])).toBe(0);
  });
});

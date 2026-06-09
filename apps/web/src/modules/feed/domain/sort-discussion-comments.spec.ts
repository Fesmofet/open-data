import type { FeedStoryView } from '../application/dto/feed-story.dto';

import { sortDiscussionComments } from './sort-discussion-comments';

function story(
  id: string,
  createdAt: string,
  netRshares = '0',
  reputation = 0,
): FeedStoryView {
  return {
    id,
    authorName: id.split('/')[0] ?? 'a',
    permlink: id.split('/')[1] ?? 'p',
    createdAt,
    excerpt: '',
    netRshares,
    authorReputation: reputation,
  };
}

describe('sortDiscussionComments', () => {
  it('sorts NEWEST by createdAt descending', () => {
    const a = story('a/old', '2024-01-01T00:00:00Z');
    const b = story('b/new', '2024-06-01T00:00:00Z');
    expect(sortDiscussionComments([a, b], 'NEWEST').map((s) => s.id)).toEqual(['b/new', 'a/old']);
  });

  it('sorts BEST by net rshares when payouts tie', () => {
    const low = story('a/low', '2024-01-01T00:00:00Z', '10');
    const high = story('b/high', '2024-01-01T00:00:00Z', '100');
    expect(sortDiscussionComments([low, high], 'BEST').map((s) => s.id)).toEqual(['b/high', 'a/low']);
  });
});

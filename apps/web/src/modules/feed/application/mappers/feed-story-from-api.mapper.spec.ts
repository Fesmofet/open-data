import { mapFeedStoryItemApiToView } from './feed-story-from-api.mapper';
import type { FeedStoryItemApi } from './feed-story-from-api.mapper';

function feedItem(overrides: Partial<FeedStoryItemApi> = {}): FeedStoryItemApi {
  return {
    id: 'alice/post-1',
    author: 'alice',
    permlink: 'post-1',
    title: 'Title',
    excerpt: 'Excerpt',
    createdAt: '2024-01-01T00:00:00.000Z',
    feedAt: '2024-01-01T00:00:00.000Z',
    rebloggedBy: null,
    isNsfw: false,
    category: null,
    children: 0,
    pendingPayout: '0',
    totalPayout: '0',
    netRshares: '0',
    thumbnailUrl: null,
    videoThumbnailUrl: null,
    videoEmbedUrl: null,
    authorProfile: {
      name: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
      reputation: 25,
      wobjectsWeight: 469.18,
    },
    objects: [],
    votes: { totalCount: 0, previewVoters: [] },
    ...overrides,
  };
}

describe('mapFeedStoryItemApiToView', () => {
  it('maps authorProfile.wobjectsWeight to authorWobjectsWeight', () => {
    const view = mapFeedStoryItemApiToView(feedItem());
    expect(view.authorWobjectsWeight).toBe(469.18);
    expect(view.authorReputation).toBe(25);
  });

  it('defaults missing wobjectsWeight to 0', () => {
    const view = mapFeedStoryItemApiToView(
      feedItem({
        authorProfile: {
          name: 'alice',
          displayName: null,
          avatarUrl: null,
          reputation: 25,
        },
      }),
    );
    expect(view.authorWobjectsWeight).toBe(0);
  });

  it('defaults missing pin flags and maps API pin fields', () => {
    const view = mapFeedStoryItemApiToView(
      feedItem({
        pin: true,
        hasPinUpdate: true,
        hasRemoveUpdate: true,
      }),
    );
    expect(view.pin).toBe(true);
    expect(view.hasPinUpdate).toBe(true);
    expect(view.hasRemoveUpdate).toBe(true);
  });
});

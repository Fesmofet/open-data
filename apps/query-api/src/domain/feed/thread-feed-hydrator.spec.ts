import type { Thread } from '@opden-data-layer/core';

import { AccountsCurrentRepository } from '../../repositories/accounts-current.repository';
import { ThreadsRepository } from '../../repositories/threads.repository';
import { encodeFeedCursor } from './feed-cursor';
import type { FeedStoryItemDto } from './feed-story-dtos';
import { hydrateThreadFeedPage } from './thread-feed-hydrator';

function threadRow(
  author: string,
  permlink: string,
  created_unix: number,
): Thread {
  return {
    author,
    permlink,
    parent_author: '',
    parent_permlink: '',
    body: 'Hello thread',
    created: '',
    replies: [],
    children: 0,
    depth: 0,
    author_reputation: BigInt(25),
    deleted: false,
    bulk_message: false,
    type: 'ecencythreads',
    hashtags: ['waivio'],
    mentions: [],
    tickers: [],
    links: [],
    images: [],
    threadstorm: false,
    net_rshares: null,
    pending_payout_value: null,
    total_payout_value: null,
    percent_hbd: null,
    cashout_time: null,
    created_unix,
    updated_at_unix: created_unix,
  };
}

function feedItem(author: string, permlink: string): FeedStoryItemDto {
  return {
    id: `${author}/${permlink}`,
    author,
    permlink,
    title: '',
    excerpt: 'Hello thread',
    createdAt: '2024-01-01T00:00:00.000Z',
    feedAt: '2024-01-01T00:00:00.000Z',
    rebloggedBy: null,
    rebloggedByViewer: false,
    isNsfw: false,
    category: 'ecencythreads',
    children: 0,
    pendingPayout: '',
    totalPayout: '',
    reward: null,
    waivRewardEligible: false,
    netRshares: '',
    thumbnailUrl: null,
    videoThumbnailUrl: null,
    videoEmbedUrl: null,
    authorProfile: {
      name: author,
      displayName: author,
      avatarUrl: null,
      reputation: 25,
      wobjectsWeight: 0,
    },
    objects: [],
    votes: { totalCount: 0, previewVoters: [], voted: false },
  };
}

describe('hydrateThreadFeedPage', () => {
  let threadsRepo: jest.Mocked<
    Pick<ThreadsRepository, 'findThreadActiveVoteSummaries'>
  >;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByNames'>>;

  beforeEach(() => {
    threadsRepo = {
      findThreadActiveVoteSummaries: jest.fn().mockResolvedValue(new Map()),
    };
    accounts = {
      findByNames: jest.fn().mockResolvedValue([]),
    };
  });

  it('returns empty page when no rows', async () => {
    const r = await hydrateThreadFeedPage(
      { threadsRepo: threadsRepo as unknown as ThreadsRepository, accounts: accounts as unknown as AccountsCurrentRepository },
      [],
      20,
    );
    expect(r).toEqual({ items: [], cursor: null, hasMore: false });
  });

  it('slices to limit and sets hasMore', async () => {
    const rows = [
      threadRow('alice', 't-1', 100),
      threadRow('bob', 't-2', 90),
    ];
    const r = await hydrateThreadFeedPage(
      { threadsRepo: threadsRepo as unknown as ThreadsRepository, accounts: accounts as unknown as AccountsCurrentRepository },
      rows,
      1,
    );
    expect(r.items).toHaveLength(1);
    expect(r.items[0].author).toBe('alice');
    expect(r.hasMore).toBe(true);
    expect(r.cursor).toBe(
      encodeFeedCursor({ feedAt: 100, author: 'alice', permlink: 't-1' }),
    );
  });

  it('hydrates vote summaries for viewer', async () => {
    const rows = [threadRow('alice', 't-1', 100)];
    threadsRepo.findThreadActiveVoteSummaries.mockResolvedValue(
      new Map([
        [
          'alice\0t-1',
          { totalCount: 2, previewVoters: ['bob'], voted: true },
        ],
      ]),
    );

    const r = await hydrateThreadFeedPage(
      { threadsRepo: threadsRepo as unknown as ThreadsRepository, accounts: accounts as unknown as AccountsCurrentRepository },
      rows,
      20,
      'viewer',
    );
    expect(r.items[0].votes).toEqual({
      totalCount: 2,
      previewVoters: ['bob'],
      voted: true,
    });
    expect(threadsRepo.findThreadActiveVoteSummaries).toHaveBeenCalledWith(
      [{ author: 'alice', permlink: 't-1' }],
      'viewer',
    );
  });
});

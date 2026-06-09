import { HiveClient } from '@opden-data-layer/clients';
import type { HiveContentType } from '@opden-data-layer/clients';

import { AccountsCurrentRepository, PostsRepository } from '../../repositories';
import { GetPostDiscussionEndpoint } from './get-post-discussion.endpoint';
import { createPassthroughPostRewardServiceMock } from './post-reward.service.mock';
import type { PostRewardService } from './post-reward.service';

describe('GetPostDiscussionEndpoint', () => {
  const authorProfile = {
    name: 'bob',
    displayName: null,
    avatarUrl: null,
    reputation: 25,
  };

  let hiveClient: jest.Mocked<Pick<HiveClient, 'getState' | 'getAccounts'>>;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByNames'>>;
  let postsRepo: jest.Mocked<
    Pick<PostsRepository, 'findViewerRebloggedKeys' | 'findPostsByKeys'>
  >;
  const postRewardService = createPassthroughPostRewardServiceMock();

  beforeEach(() => {
    hiveClient = {
      getState: jest.fn(),
      getAccounts: jest.fn().mockResolvedValue([]),
    };
    accounts = {
      findByNames: jest.fn().mockResolvedValue([]),
    };
    postsRepo = {
      findViewerRebloggedKeys: jest.fn().mockResolvedValue(new Set()),
      findPostsByKeys: jest.fn().mockResolvedValue([]),
    };
  });

  function createEndpoint(): GetPostDiscussionEndpoint {
    return new GetPostDiscussionEndpoint(
      hiveClient as unknown as HiveClient,
      accounts as unknown as AccountsCurrentRepository,
      postsRepo as unknown as PostsRepository,
      postRewardService as unknown as PostRewardService,
    );
  }

  it('returns null when root post is missing from discussion', async () => {
    hiveClient.getState.mockResolvedValue({ content: {} });
    expect(await createEndpoint().execute('alice', 'post')).toBeNull();
  });

  it('maps depth-1 comments and rebloggedByViewer', async () => {
    const content: Record<string, HiveContentType> = {
      'alice/post': {
        author: 'alice',
        permlink: 'post',
        depth: '0',
        reblogged_users: ['viewer'],
        replies: ['bob/c1'],
      } as HiveContentType,
      'bob/c1': {
        author: 'bob',
        permlink: 'c1',
        depth: '1',
        body: 'hello',
        created: '2024-01-01T00:00:00',
        reblogged_users: [],
        active_votes: [],
      } as HiveContentType,
    };
    hiveClient.getState.mockResolvedValue({ content });
    accounts.findByNames.mockResolvedValue([]);

    const result = await createEndpoint().execute('alice', 'post', 'viewer');
    expect(result?.rootCommentIds).toEqual(['bob/c1']);
    expect(result?.comments['bob/c1']?.author).toBe('bob');
    expect(result?.rebloggedByViewer).toBe(true);
    expect(result?.rebloggedUsers).toEqual(['viewer']);
  });

  it('keeps full comment body (not feed excerpt truncation)', async () => {
    const longBody = 'x'.repeat(500);
    const content: Record<string, HiveContentType> = {
      'alice/post': {
        author: 'alice',
        permlink: 'post',
        depth: '0',
        reblogged_users: [],
        replies: ['bob/c1'],
      } as HiveContentType,
      'bob/c1': {
        author: 'bob',
        permlink: 'c1',
        depth: '1',
        body: longBody,
        created: '2024-01-01T00:00:00',
        reblogged_users: [],
        active_votes: [],
      } as HiveContentType,
    };
    hiveClient.getState.mockResolvedValue({ content });

    const comment = await createEndpoint().execute('alice', 'post');
    expect(comment?.comments['bob/c1']?.body).toBe(longBody);
    expect(comment?.comments['bob/c1']?.excerpt.length).toBeLessThan(longBody.length);
  });
});

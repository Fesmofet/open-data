import { ForbiddenException } from '@nestjs/common';

import type { AccountsCurrentRepository } from '../../repositories/accounts-current.repository';
import type { MessagingRepository } from '../../repositories/messaging.repository';
import type { PostRepliesRepository } from '../../repositories/post-replies.repository';
import type { ProfileFeedReadCursorRepository } from '../../repositories/profile-feed-read-cursor.repository';
import type { ThreadRepliesRepository } from '../../repositories/thread-replies.repository';
import type { UserAccountMutesRepository } from '../../repositories/user-account-mutes.repository';
import { GetUserFeedUnreadCountsEndpoint } from './get-user-feed-unread-counts.endpoint';

describe('GetUserFeedUnreadCountsEndpoint', () => {
  const accounts = { findByName: jest.fn() };
  const readCursorRepo = { getCursors: jest.fn() };
  const postRepliesRepo = { countUnreadOnUserPosts: jest.fn() };
  const threadRepliesRepo = { countUnreadOnUserThreads: jest.fn() };
  const messagingRepo = { countTotalUnreadForViewer: jest.fn() };
  const userAccountMutesRepo = { listMutedForMuters: jest.fn() };

  const endpoint = new GetUserFeedUnreadCountsEndpoint(
    accounts as unknown as AccountsCurrentRepository,
    readCursorRepo as unknown as ProfileFeedReadCursorRepository,
    postRepliesRepo as unknown as PostRepliesRepository,
    threadRepliesRepo as unknown as ThreadRepliesRepository,
    messagingRepo as unknown as MessagingRepository,
    userAccountMutesRepo as unknown as UserAccountMutesRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forbids when viewer does not match account', async () => {
    await expect(endpoint.execute('alice', 'bob')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);

    const result = await endpoint.execute('alice', 'alice');

    expect(result).toBeNull();
    expect(readCursorRepo.getCursors).not.toHaveBeenCalled();
  });

  it('returns unread counts for the authenticated viewer', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    readCursorRepo.getCursors.mockResolvedValue({ posts: 100, threads: 200 });
    userAccountMutesRepo.listMutedForMuters.mockResolvedValue(['muted1']);
    postRepliesRepo.countUnreadOnUserPosts.mockResolvedValue(3);
    threadRepliesRepo.countUnreadOnUserThreads.mockResolvedValue(5);
    messagingRepo.countTotalUnreadForViewer.mockResolvedValue(7);

    const result = await endpoint.execute('alice', 'alice');

    expect(postRepliesRepo.countUnreadOnUserPosts).toHaveBeenCalledWith(
      'alice',
      100,
      ['muted1'],
    );
    expect(threadRepliesRepo.countUnreadOnUserThreads).toHaveBeenCalledWith(
      'alice',
      200,
      ['muted1'],
    );
    expect(messagingRepo.countTotalUnreadForViewer).toHaveBeenCalledWith('alice');
    expect(result).toEqual({ posts: 3, threads: 5, messages: 7 });
  });
});

import { ForbiddenException, Injectable } from '@nestjs/common';

import { normalizeHiveAccount } from '../../auth';
import {
  AccountsCurrentRepository,
  MessagingRepository,
  PostRepliesRepository,
  ProfileFeedReadCursorRepository,
  ThreadRepliesRepository,
  UserAccountMutesRepository,
} from '../../repositories';
import type { FeedUnreadCountsResponse } from './feed-unread.schema';

@Injectable()
export class GetUserFeedUnreadCountsEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly readCursorRepo: ProfileFeedReadCursorRepository,
    private readonly postRepliesRepo: PostRepliesRepository,
    private readonly threadRepliesRepo: ThreadRepliesRepository,
    private readonly messagingRepo: MessagingRepository,
    private readonly userAccountMutesRepo: UserAccountMutesRepository,
  ) {}

  async execute(
    accountName: string,
    viewerAccount?: string | null,
  ): Promise<FeedUnreadCountsResponse | null> {
    const account = normalizeHiveAccount(accountName);
    const viewer = viewerAccount?.trim()
      ? normalizeHiveAccount(viewerAccount)
      : null;
    if (!viewer || viewer !== account) {
      throw new ForbiddenException();
    }

    const accountRow = await this.accounts.findByName(account);
    if (!accountRow) {
      return null;
    }

    const cursors = await this.readCursorRepo.getCursors(account);
    const mutedAuthors = await this.userAccountMutesRepo.listMutedForMuters([viewer]);

    const [posts, threads, messages] = await Promise.all([
      this.postRepliesRepo.countUnreadOnUserPosts(
        account,
        cursors?.posts ?? null,
        mutedAuthors,
      ),
      this.threadRepliesRepo.countUnreadOnUserThreads(
        account,
        cursors?.threads ?? null,
        mutedAuthors,
      ),
      this.messagingRepo.countTotalUnreadForViewer(viewer),
    ]);

    return { posts, threads, messages };
  }
}

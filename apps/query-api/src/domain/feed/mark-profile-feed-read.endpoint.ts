import { ForbiddenException, Injectable } from '@nestjs/common';

import { normalizeHiveAccount } from '../../auth';
import {
  AccountsCurrentRepository,
  ProfileFeedReadCursorRepository,
} from '../../repositories';
import type {
  MarkProfileFeedReadBody,
  MarkProfileFeedReadResponse,
} from './feed-unread.schema';

@Injectable()
export class MarkProfileFeedReadEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly readCursorRepo: ProfileFeedReadCursorRepository,
  ) {}

  async execute(
    accountName: string,
    body: MarkProfileFeedReadBody,
    viewerAccount?: string | null,
  ): Promise<MarkProfileFeedReadResponse | null> {
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

    if (body.tab === 'messages') {
      return {
        updated: false,
        read_at_unix: body.read_at_unix,
      };
    }

    const updated = await this.readCursorRepo.setCursorMonotonic(
      account,
      body.tab,
      body.read_at_unix,
    );

    const cursors = await this.readCursorRepo.getCursors(account);
    const stored =
      body.tab === 'posts'
        ? cursors?.posts ?? body.read_at_unix
        : cursors?.threads ?? body.read_at_unix;

    return {
      updated,
      read_at_unix: stored,
    };
  }
}

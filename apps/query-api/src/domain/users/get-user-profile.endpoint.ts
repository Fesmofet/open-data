import { Injectable, Logger } from '@nestjs/common';

import { AccountsCurrentRepository, UserSubscriptionsRepository } from '../../repositories';
import { mapAccountToUserProfileView } from './account-mapper';
import { HiveAccountsCache } from './hive-accounts.cache';
import type { UserProfileView } from './user-profile.types';

export { parsePostingMetadata } from './parse-posting-metadata';
export type { UserProfileView } from './user-profile.types';

@Injectable()
export class GetUserProfileEndpoint {
  private readonly logger = new Logger(GetUserProfileEndpoint.name);

  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly subscriptions: UserSubscriptionsRepository,
    private readonly hiveAccounts: HiveAccountsCache,
  ) {}

  async execute(
    accountName: string,
    viewerAccount?: string | null,
  ): Promise<UserProfileView | null> {
    const viewer = viewerAccount?.trim() || null;
    const [row, viewerFollow] = await Promise.all([
      this.accounts.findByName(accountName),
      viewer
        ? this.subscriptions.findByFollowerAndFollowing(viewer, accountName)
        : Promise.resolve(null),
    ]);
    if (!row) {
      return null;
    }

    let chainPostingJsonMetadata: string | null = null;
    try {
      const hiveAccount = await this.hiveAccounts.getAccount(
        accountName.trim().toLowerCase(),
      );
      chainPostingJsonMetadata = hiveAccount?.posting_json_metadata ?? null;
    } catch (e) {
      this.logger.warn(
        `profile chain metadata degraded for ${accountName}: ${(e as Error).message}`,
      );
    }

    return {
      ...mapAccountToUserProfileView(row, chainPostingJsonMetadata),
      is_following: viewerFollow != null,
      viewer_bell: viewerFollow?.bell === true,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { AccountsCurrentRepository, UserAccountAuthsRepository } from '../../repositories';
import type { UserAccountAuthListQuery } from './user-account-auth-list.schema';
import type { PaginatedUserAccountAuthGrantors } from './user-account-auth-list.types';

@Injectable()
export class GetUserAuthorityGrantorsEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly accountAuths: UserAccountAuthsRepository,
  ) {}

  async execute(
    username: string,
    query: UserAccountAuthListQuery,
  ): Promise<PaginatedUserAccountAuthGrantors | null> {
    const name = username.trim();
    if (name.length === 0) {
      return null;
    }

    const row = await this.accounts.findByName(name);
    if (!row) {
      return null;
    }

    const [total, rows] = await Promise.all([
      this.accountAuths.countGrantorsFor(name, query.type),
      this.accountAuths.findGrantorsFor(name, query.type, query.skip, query.limit),
    ]);

    const items = rows.map((r) => ({
      grantor: r.grantor,
      authorityType: r.authority_type,
    }));

    return {
      items,
      total,
      hasMore: query.skip + items.length < total,
    };
  }
}

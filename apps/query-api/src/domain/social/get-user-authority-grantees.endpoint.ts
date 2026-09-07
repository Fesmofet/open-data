import { Injectable } from '@nestjs/common';
import { AccountsCurrentRepository, UserAccountAuthsRepository } from '../../repositories';
import type { UserAccountAuthListQuery } from './user-account-auth-list.schema';
import type { PaginatedUserAccountAuthGrantees } from './user-account-auth-list.types';

@Injectable()
export class GetUserAuthorityGranteesEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly accountAuths: UserAccountAuthsRepository,
  ) {}

  async execute(
    username: string,
    query: UserAccountAuthListQuery,
  ): Promise<PaginatedUserAccountAuthGrantees | null> {
    const name = username.trim();
    if (name.length === 0) {
      return null;
    }

    const row = await this.accounts.findByName(name);
    if (!row) {
      return null;
    }

    const [total, rows] = await Promise.all([
      this.accountAuths.countGranteesFor(name, query.type),
      this.accountAuths.findGranteesFor(name, query.type, query.skip, query.limit),
    ]);

    const items = rows.map((r) => ({
      grantee: r.grantee,
      authorityType: r.authority_type,
    }));

    return {
      items,
      total,
      hasMore: query.skip + items.length < total,
    };
  }
}

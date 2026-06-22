import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  HiveClient,
  HiveNodeUnavailableError,
} from '@opden-data-layer/clients';

import { AccountsCurrentRepository, UserRcDelegationsRepository } from '../../repositories';
import type { HiveRcDelegationsResponse } from './schemas/hive-wallet.schema';

@Injectable()
export class GetUserHiveRcDelegationsEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly userRcDelegations: UserRcDelegationsRepository,
    private readonly hiveClient: HiveClient,
  ) {}

  async execute(profileAccountName: string): Promise<HiveRcDelegationsResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const normalized = profileAccountName.trim().toLowerCase();

    try {
      const [incoming, outgoing] = await Promise.all([
        this.userRcDelegations.findRcDelegationsTo(normalized),
        this.hiveClient.listRcDirectDelegationsStrict(normalized, '', 1000),
      ]);

      return {
        account: profileAccountName,
        incoming: incoming.map((row) => ({
          from: row.delegator,
          to: row.delegatee,
          delegatedRc: Number(row.rc),
        })),
        outgoing: outgoing.map((row) => ({
          from: row.from,
          to: row.to,
          delegatedRc: row.delegated_rc,
        })),
      };
    } catch (e) {
      if (e instanceof HiveNodeUnavailableError) {
        throw new ServiceUnavailableException('Hive node unavailable');
      }
      throw e;
    }
  }
}

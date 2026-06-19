import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HiveEngineClient, HiveEngineUnavailableError } from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import type { EngineTokenDelegationsResponse } from './schemas/engine-token-delegations.schema';

@Injectable()
export class GetUserEngineTokenDelegationsEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveEngine: HiveEngineClient,
  ) {}

  async execute(
    profileAccountName: string,
    symbol: string,
  ): Promise<EngineTokenDelegationsResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    if (normalizedSymbol.length === 0) {
      throw new BadRequestException('Invalid token symbol');
    }

    try {
      const [incoming, outgoing] = await Promise.all([
        this.hiveEngine.findTokenDelegationsStrict({
          query: { to: profileAccountName, symbol: normalizedSymbol },
          limit: 1000,
        }),
        this.hiveEngine.findTokenDelegationsStrict({
          query: { from: profileAccountName, symbol: normalizedSymbol },
          limit: 1000,
        }),
      ]);

      const mapRow = (row: {
        from: string;
        to: string;
        symbol: string;
        quantity: string;
        created: number;
        updated: number;
      }) => ({
        from: row.from,
        to: row.to,
        symbol: row.symbol,
        quantity: row.quantity,
        created: row.created,
        updated: row.updated,
      });

      return {
        account: profileAccountName,
        symbol: normalizedSymbol,
        incoming: incoming.map(mapRow),
        outgoing: outgoing.map(mapRow),
      };
    } catch (e) {
      if (e instanceof HiveEngineUnavailableError) {
        throw new ServiceUnavailableException('Hive Engine unavailable');
      }
      throw e;
    }
  }
}

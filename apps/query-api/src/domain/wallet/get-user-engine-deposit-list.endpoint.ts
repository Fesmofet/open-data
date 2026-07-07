import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HiveEngineConvertClient } from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import { buildDepositTokenList } from './engine-swap/build-deposit-token-list';
import type { EngineDepositListResponse } from './schemas/engine-swap.schema';

@Injectable()
export class GetUserEngineDepositListEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly convertClient: HiveEngineConvertClient,
  ) {}

  async execute(profileAccountName: string): Promise<EngineDepositListResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const [pairs, coins] = await Promise.all([
      this.convertClient.listPairs(),
      this.convertClient.listCoins(),
    ]);
    if (!pairs || !coins) {
      throw new ServiceUnavailableException('Hive Engine converter unavailable');
    }

    return {
      account: profileAccountName,
      tokens: buildDepositTokenList(pairs, coins),
    };
  }
}

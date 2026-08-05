import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  HiveEngineClient,
  HiveEngineConvertClient,
  HiveEngineUnavailableError,
  TribaldexClient,
  type HiveEngineTokenBalance,
} from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import { buildWithdrawTokenList } from './engine-swap/build-withdraw-token-list';
import {
  attachWithdrawOutputLimits,
  getWithdrawOutputLimits,
} from './engine-swap/get-withdraw-output-limits';
import type { EngineWithdrawListResponse } from './schemas/engine-swap.schema';

@Injectable()
export class GetUserEngineWithdrawListEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly convertClient: HiveEngineConvertClient,
    private readonly hiveEngine: HiveEngineClient,
    private readonly tribaldexClient: TribaldexClient,
  ) {}

  async execute(profileAccountName: string): Promise<EngineWithdrawListResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    try {
      const [pairs, coins, balances] = await Promise.all([
        this.convertClient.listPairs(),
        this.convertClient.listCoins(),
        this.hiveEngine.findStrict<HiveEngineTokenBalance>({
          contract: 'tokens',
          table: 'balances',
          query: { account: profileAccountName },
          limit: 1000,
        }),
      ]);
      if (!pairs || !coins) {
        throw new ServiceUnavailableException('Hive Engine converter unavailable');
      }

      const balanceBySymbol = new Map(
        balances.map((row) => [row.symbol.toUpperCase(), row.balance]),
      );
      const symbols = [...new Set([...balanceBySymbol.keys(), 'WAIV'])];
      const tokenRows =
        symbols.length > 0
          ? await this.hiveEngine.findTokens({
              query: { symbol: { $in: symbols } },
              limit: symbols.length,
            })
          : [];
      const precisionBySymbol = new Map(
        tokenRows.map((token) => [token.symbol.toUpperCase(), token.precision]),
      );

      const tokens = buildWithdrawTokenList({
        pairs,
        coins,
        balances: balanceBySymbol,
        precisionBySymbol,
      });
      const limits = await getWithdrawOutputLimits({
        fetchBtcMinimum: () => this.tribaldexClient.getBtcMinimumWithdrawal(),
      });

      return {
        account: profileAccountName,
        tokens: attachWithdrawOutputLimits(tokens, limits),
      };
    } catch (e) {
      if (e instanceof HiveEngineUnavailableError) {
        throw new ServiceUnavailableException('Hive Engine unavailable');
      }
      throw e;
    }
  }
}

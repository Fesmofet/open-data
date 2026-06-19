import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HiveEngineClient, HiveEngineUnavailableError } from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import { AccountsCurrentRepository } from '../../repositories';
import {
  buildWaivWalletSummary,
  mapTokenBalanceRow,
} from './build-waiv-wallet-summary';
import type { WaivWalletResponse } from './schemas/waiv-wallet.schema';
import { WAIV_SYMBOL } from './schemas/waiv-wallet.schema';

@Injectable()
export class GetUserWaivWalletEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveEngine: HiveEngineClient,
    private readonly currencyQuery: CurrencyQueryService,
  ) {}

  async execute(profileAccountName: string): Promise<WaivWalletResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    try {
      const [balanceRow, engineRates] = await Promise.all([
        this.hiveEngine.findOneTokenBalanceStrict({
          account: profileAccountName,
          symbol: WAIV_SYMBOL,
        }),
        this.currencyQuery.engineCurrent(WAIV_SYMBOL),
      ]);

      const balance = mapTokenBalanceRow(balanceRow);
      const rates = {
        waivHive: engineRates?.HIVE ?? 0,
        waivUsd: engineRates?.USD ?? 0,
      };

      let nextUnstakeAt: number | null = null;
      const pendingUnstake = Number.parseFloat(balance.pendingUnstake);
      if (Number.isFinite(pendingUnstake) && pendingUnstake > 0) {
        const pendingRows = await this.hiveEngine.findTokenPendingUnstakesStrict({
          query: { account: profileAccountName, symbol: WAIV_SYMBOL },
          limit: 1000,
        });
        const timestamps = pendingRows
          .map((row) => row.nextTransactionTimestamp)
          .filter((ts) => typeof ts === 'number' && ts > 0);
        nextUnstakeAt =
          timestamps.length > 0 ? Math.min(...timestamps) : null;
      }

      const summary = buildWaivWalletSummary(balance, rates, nextUnstakeAt);

      return {
        account: profileAccountName,
        ...summary,
        rates,
      };
    } catch (e) {
      if (e instanceof HiveEngineUnavailableError) {
        throw new ServiceUnavailableException('Hive Engine unavailable');
      }
      throw e;
    }
  }
}

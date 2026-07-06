import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  HiveEngineClient,
  HiveEngineUnavailableError,
} from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';
import {
  ENGINE_PINNED_SWAP_SYMBOLS,
  ENGINE_WALLET_EXCLUDED_SYMBOLS,
} from '@opden-data-layer/core/hive-engine-history';

import { AccountsCurrentRepository } from '../../repositories';
import { buildEngineWalletSummary } from './build-engine-wallet-summary';
import type { EngineWalletResponse } from './schemas/engine-wallet.schema';

function parseCoingeckoUsd(block: unknown): number {
  if (!block || typeof block !== 'object') {
    return 0;
  }
  const usd = (block as { usd?: unknown }).usd;
  const parsed = Number(usd);
  return Number.isFinite(parsed) ? parsed : 0;
}

@Injectable()
export class GetUserEngineWalletEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveEngine: HiveEngineClient,
    private readonly currencyQuery: CurrencyQueryService,
  ) {}

  async execute(profileAccountName: string): Promise<EngineWalletResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    try {
      const [accountBalances, market] = await Promise.all([
        this.hiveEngine.findTokenBalances({
          query: { account: profileAccountName },
          limit: 1000,
        }),
        this.currencyQuery.marketInfo({}),
      ]);

      const excludedSet = new Set<string>(ENGINE_WALLET_EXCLUDED_SYMBOLS);
      const otherSymbols = accountBalances
        .map((row) => row.symbol)
        .filter((symbol) => !excludedSet.has(symbol));

      const metadataSymbols = [
        ...ENGINE_PINNED_SWAP_SYMBOLS,
        ...otherSymbols,
      ];

      const [tokenMetadata, swapUsdRows, marketMetrics] = await Promise.all([
        metadataSymbols.length > 0
          ? this.hiveEngine.findTokens({
              query: { symbol: { $in: metadataSymbols } },
              limit: metadataSymbols.length,
            })
          : Promise.resolve([]),
        this.currencyQuery.enginePoolsUsdCsv(
          ENGINE_PINNED_SWAP_SYMBOLS.join(','),
        ),
        otherSymbols.length > 0
          ? this.hiveEngine.findMarketMetrics({
              query: { symbol: { $in: otherSymbols } },
              limit: otherSymbols.length,
            })
          : Promise.resolve([]),
      ]);

      const hiveUsd = parseCoingeckoUsd(market.current.hive);
      const swapUsdBySymbol = new Map(
        swapUsdRows.map((row) => [row.symbol, row.USD]),
      );

      const summary = buildEngineWalletSummary({
        accountBalances,
        tokenMetadata,
        swapUsdBySymbol,
        marketMetrics,
        hiveUsd,
      });

      return {
        account: profileAccountName,
        ...summary,
        rates: { hiveUsd },
      };
    } catch (e) {
      if (e instanceof HiveEngineUnavailableError) {
        throw new ServiceUnavailableException('Hive Engine unavailable');
      }
      throw e;
    }
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { WAIV_TOKEN } from '@opden-data-layer/core';
import type { Database } from '../../database';
import { KYSELY } from '../../database';

export type TokenUsdQuote = {
  amountUsd: string;
  rateUsd: string;
};

@Injectable()
export class OblUsdRatesService {
  private readonly logger = new Logger(OblUsdRatesService.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async tokenToUsd(symbol: string, quantity: number): Promise<TokenUsdQuote | null> {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return null;
    }

    const normalized = symbol.trim().toUpperCase();
    const rateUsd =
      normalized === WAIV_TOKEN.SYMBOL
        ? await this.waivRateUsd()
        : await this.swapPoolRateUsd(normalized);

    if (rateUsd === null || rateUsd <= 0) {
      this.logger.warn(`OBL USD rate unavailable for ${normalized}`);
      return null;
    }

    const amountUsd = (quantity * rateUsd).toFixed(8);
    return { amountUsd, rateUsd: rateUsd.toFixed(18) };
  }

  private async waivRateUsd(): Promise<number | null> {
    try {
      const row = await this.db
        .selectFrom('hive_engine_rates')
        .select('rate_usd')
        .where('base', '=', WAIV_TOKEN.SYMBOL)
        .where('is_daily', '=', false)
        .orderBy('date', 'desc')
        .limit(1)
        .executeTakeFirst();
      return row ? Number(row.rate_usd) : null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  private async swapPoolRateUsd(symbol: string): Promise<number | null> {
    try {
      const row = await this.db
        .selectFrom('hive_engine_swap_pool_usd')
        .select('usd')
        .where('symbol', '=', symbol)
        .executeTakeFirst();
      return row ? Number(row.usd) : null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }
}

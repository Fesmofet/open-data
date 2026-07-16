import { Injectable } from '@nestjs/common';
import { CurrencyQueryService } from '@opden-data-layer/currency';
import type { UsdToWaivQuery } from './obl.schemas';

@Injectable()
export class OblConversionService {
  constructor(private readonly currency: CurrencyQueryService) {}

  async usdToWaiv(query: UsdToWaivQuery): Promise<{
    amountUsd: number;
    rateUsd: number | null;
    amountWaiv: number | null;
  }> {
    const rates = await this.currency.engineLatestStored();
    const rateUsd = rates?.USD ?? null;
    if (rateUsd === null || rateUsd <= 0) {
      return { amountUsd: query.amountUsd, rateUsd: null, amountWaiv: null };
    }
    return {
      amountUsd: query.amountUsd,
      rateUsd,
      amountWaiv: query.amountUsd / rateUsd,
    };
  }
}

import { Injectable } from '@nestjs/common';
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@opden-data-layer/core';
import {
  CurrencyQueryService,
  moneyLineFromUsd,
} from '@opden-data-layer/currency';

import { calculatePostRewardUsd } from './calculate-post-reward-usd';
import { isWaivRewardEligible } from './post-reward-eligibility';
import type {
  MoneyLineDto,
  PostRewardDto,
  PostRewardInput,
  PostRewardUsdBreakdown,
} from './post-reward.types';

function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

@Injectable()
export class PostRewardService {
  constructor(private readonly currencyQuery: CurrencyQueryService) {}

  async resolveCurrency(raw: string | undefined): Promise<SupportedCurrency> {
    const upper = (raw ?? 'USD').trim().toUpperCase();
    return isSupportedCurrency(upper) ? upper : 'USD';
  }

  async buildReward(
    input: PostRewardInput,
    currency: SupportedCurrency,
    waivUsdRate?: number,
  ): Promise<PostRewardDto | null> {
    const waivRate =
      waivUsdRate ??
      (await this.currencyQuery.engineCurrent()).USD ??
      0;
    const usd = calculatePostRewardUsd(input, waivRate);
    if (!usd) {
      return null;
    }
    const fiatRates = await this.currencyQuery.legacyRateLatest(
      'USD',
      SUPPORTED_CURRENCIES.join(','),
    );
    return this.mapUsdToDto(usd, currency, fiatRates);
  }

  async enrichFeedItems<T extends object>(
    items: T[],
    inputs: PostRewardInput[],
    currency: SupportedCurrency,
  ): Promise<Array<T & { reward: PostRewardDto | null; waivRewardEligible: boolean }>> {
    const waivRates = await this.currencyQuery.engineCurrent();
    const waivUsdRate = waivRates?.USD ?? 0;
    const fiatRates = await this.currencyQuery.legacyRateLatest(
      'USD',
      SUPPORTED_CURRENCIES.join(','),
    );

    return items.map((item, index) => {
      const input = inputs[index];
      const usd = calculatePostRewardUsd(input, waivUsdRate);
      const reward = usd ? this.mapUsdToDto(usd, currency, fiatRates) : null;
      return {
        ...item,
        reward,
        waivRewardEligible: isWaivRewardEligible(input.jsonMetadata),
      };
    });
  }

  private mapUsdToDto(
    usd: PostRewardUsdBreakdown,
    currency: SupportedCurrency,
    fiatRates: Record<string, number>,
  ): PostRewardDto | null {
    const badgeUsd = usd.phase === 'paid' ? usd.totalUsd : usd.potentialUsd;
    if (badgeUsd <= 0 && !usd.isPayoutDeclined) {
      return null;
    }

    const line = (amountUsd: number): MoneyLineDto =>
      moneyLineFromUsd(amountUsd, currency, fiatRates);

    const beneficiaries = usd.beneficiaries.map((b) => {
      const payoutUsd = (usd.authorUsd * b.percent) / 100;
      return {
        account: b.account,
        percent: b.percent,
        payout: payoutUsd > 0 ? line(payoutUsd) : undefined,
      };
    });

    const breakdown = {
      waiv: line(usd.waivUsd),
      hive: line(usd.hiveUsd),
      hbd: line(usd.hbdUsd),
      total: line(usd.phase === 'paid' ? usd.totalUsd : usd.potentialUsd),
      authorPayout: usd.authorUsd > 0 ? line(usd.authorUsd) : undefined,
      curatorPayout: usd.curatorUsd > 0 ? line(usd.curatorUsd) : undefined,
    };

    const badgeLine = line(badgeUsd);

    return {
      amount: badgeLine.amount,
      currency,
      label: badgeLine.label,
      phase: usd.phase,
      breakdown,
      beneficiaries: beneficiaries.length > 0 ? beneficiaries : undefined,
      cashoutAt: usd.cashoutAt,
      isPayoutDeclined: usd.isPayoutDeclined ? true : undefined,
      payoutLimitHit: usd.payoutLimitHit ? true : undefined,
      promotionCost:
        usd.promotionCostUsd > 0 ? line(usd.promotionCostUsd) : undefined,
      rewardPowerOnly: usd.rewardPowerOnly ? true : undefined,
    };
  }
}

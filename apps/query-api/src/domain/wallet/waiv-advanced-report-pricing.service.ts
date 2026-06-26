import { Injectable } from '@nestjs/common';
import { calcDepositWithdrawals } from '@opden-data-layer/core/waiv-advanced-report';
import type { SupportedCurrency } from '@opden-data-layer/core';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';
import type { WaivAdvancedReportRowDto } from './schemas/waiv-advanced-report.schema';
import {
  splitWaivAdvancedReportDisplayAmounts,
  waivQuantityForPricing,
} from './split-waiv-advanced-report-display-amounts';

function usdTimesFiatCross(usd: number, crossRate: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(crossRate)) {
    return 0;
  }
  return usd * crossRate;
}

function fiatCrossForRow(
  currency: SupportedCurrency,
  ymd: string,
  fiatCrossByDate: ReadonlyMap<string, number>,
): number {
  if (currency === 'USD') {
    return 1;
  }
  if (ymd.length === 0) {
    return 0;
  }
  return fiatCrossByDate.get(ymd) ?? 0;
}

@Injectable()
export class WaivAdvancedReportPricingService {
  constructor(private readonly currencyQuery: CurrencyQueryService) {}

  async enrichRows(params: {
    rows: WaivAdvancedReportRawRow[];
    currency: SupportedCurrency;
    checkedKeys: ReadonlySet<string>;
  }): Promise<WaivAdvancedReportRowDto[]> {
    const dates = params.rows
      .map((row) => row.dateYmd)
      .filter((ymd) => ymd.length > 0);
    const [waivUsdByDate, fiatCrossByDate] = await Promise.all([
      this.currencyQuery.getEngineHistoricalUsdByDates(dates),
      this.currencyQuery.getFiatCrossRatesByDates(dates, params.currency),
    ]);

    return params.rows.map((row) => {
      const ymd = row.dateYmd;
      const waivUsd = waivUsdByDate.get(ymd) ?? 0;
      const fiatCross = fiatCrossForRow(params.currency, ymd, fiatCrossByDate);
      const checked = params.checkedKeys.has(
        `${row.userName}:${row.operationIndex}`,
      );
      const quantity = waivQuantityForPricing(row);
      const usd = quantity * waivUsd;
      const totalFiat = usdTimesFiatCross(usd, fiatCross);
      const waivRateFiat = waivUsd * fiatCross;
      const displayAmounts = splitWaivAdvancedReportDisplayAmounts(row);
      const waivFiat =
        displayAmounts.waivAmount.trim() !== ''
          ? usdTimesFiatCross(
              parseNumericAmount(displayAmounts.waivAmount) * waivUsd,
              fiatCross,
            )
          : 0;
      const wpFiat =
        displayAmounts.wpAmount.trim() !== ''
          ? usdTimesFiatCross(
              parseNumericAmount(displayAmounts.wpAmount) * waivUsd,
              fiatCross,
            )
          : 0;

      return {
        userName: row.userName,
        operationIndex: row.operationIndex,
        timestamp: row.timestamp,
        type: row.type,
        from: row.from,
        to: row.to,
        amount: row.amount,
        memo: row.memo,
        waivAmount: displayAmounts.waivAmount,
        wpAmount: displayAmounts.wpAmount,
        withdrawDeposit: row.withdrawDeposit,
        checked,
        waivUsd,
        waivRateFiat,
        waivFiat,
        wpFiat,
        totalFiat,
        payload: row.payload,
      };
    });
  }

  calcTotals(rows: readonly WaivAdvancedReportRowDto[]) {
    return calcDepositWithdrawals(rows);
  }
}

function parseNumericAmount(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : 0;
}

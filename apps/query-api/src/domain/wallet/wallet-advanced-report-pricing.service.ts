import { Injectable } from '@nestjs/common';
import {
  calcDepositWithdrawals,
  classifyWithdrawDeposit,
} from '@opden-data-layer/core/hive-advanced-report';
import { HIVE_OP, vestToHp } from '@opden-data-layer/core/hive-account-history';
import type { SupportedCurrency } from '@opden-data-layer/core';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import type { AdvancedReportRawRow } from './hive-advanced-report-pager.service';
import type { AdvancedReportRowDto } from './schemas/hive-advanced-report.schema';
import { splitAdvancedReportDisplayAmounts, toVestPayload } from './split-advanced-report-display-amounts';

function utcYmdFromUnix(unix: number): string {
  const d = new Date(unix * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function parseAssetAmount(
  asset: string,
): { amount: number; currency: string } | null {
  const m = asset.trim().match(/^([\d.]+)\s+([A-Za-z.]+)$/);
  if (!m) {
    return null;
  }
  const amount = Number(m[1]);
  if (!Number.isFinite(amount)) {
    return null;
  }
  return { amount, currency: m[2]!.toUpperCase() };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

@Injectable()
export class WalletAdvancedReportPricingService {
  constructor(private readonly currencyQuery: CurrencyQueryService) {}

  async enrichRows(params: {
    rows: AdvancedReportRawRow[];
    filterAccounts: readonly string[];
    currency: SupportedCurrency;
    checkedKeys: ReadonlySet<string>;
    chainContext: { totalVestingShares: string; totalVestingFundSteem: string };
  }): Promise<AdvancedReportRowDto[]> {
    const dates = params.rows.map((row) => utcYmdFromUnix(row.timestamp));
    const [hiveUsdByDate, fiatCrossByDate] = await Promise.all([
      this.currencyQuery.getHiveHistoricalUsdByDates(dates),
      this.currencyQuery.getFiatCrossRatesByDates(dates, params.currency),
    ]);

    return params.rows.map((row) => {
      const ymd = utcYmdFromUnix(row.timestamp);
      const hiveUsd = hiveUsdByDate.get(ymd)?.hiveUsd ?? 0;
      const hbdUsd = hiveUsdByDate.get(ymd)?.hbdUsd ?? 0;
      const fiatCross = fiatCrossByDate.get(ymd) ?? 1;
      const withdrawDeposit = classifyWithdrawDeposit({
        type: row.type,
        record: { type: row.type, from: row.from, to: row.to },
        userName: row.userName,
        filterAccounts: params.filterAccounts,
      });
      const checked = params.checkedKeys.has(
        `${row.userName}:${row.operationIndex}`,
      );

      const usd = this.computeUsd(row, hiveUsd, hbdUsd, params.chainContext);
      const totalFiat = usd * fiatCross;
      const hiveRateFiat = hiveUsd * fiatCross;
      const hbdRateFiat = hbdUsd * fiatCross;
      const hiveFiat = this.assetFiat(row.amount, hiveUsd, hbdUsd, fiatCross, 'HIVE');
      const hbdFiat = this.assetFiat(row.amount, hiveUsd, hbdUsd, fiatCross, 'HBD');
      const hpFiat = this.hpFiatFromRow(row, hiveUsd, fiatCross, params.chainContext);
      const displayAmounts = splitAdvancedReportDisplayAmounts(
        { ...row, withdrawDeposit },
        params.chainContext,
      );

      return {
        userName: row.userName,
        operationIndex: row.operationIndex,
        timestamp: row.timestamp,
        type: row.type,
        from: row.from,
        to: row.to,
        amount: row.amount,
        memo: row.memo,
        hiveAmount: displayAmounts.hiveAmount,
        hbdAmount: displayAmounts.hbdAmount,
        hpAmount: displayAmounts.hpAmount,
        withdrawDeposit,
        checked,
        hiveUsd,
        hbdUsd,
        hiveRateFiat,
        hbdRateFiat,
        hiveFiat,
        hbdFiat,
        hpFiat,
        totalFiat,
        payload: row.payload,
      };
    });
  }

  calcTotals(rows: AdvancedReportRowDto[]): { deposits: number; withdrawals: number } {
    return calcDepositWithdrawals(
      rows.map((row) => ({
        withdrawDeposit: row.withdrawDeposit,
        checked: row.checked,
        totalFiat: row.totalFiat,
      })),
    );
  }

  private computeUsd(
    row: AdvancedReportRawRow,
    hiveUsd: number,
    hbdUsd: number,
    chainContext: { totalVestingShares: string; totalVestingFundSteem: string },
  ): number {
    if (row.type === HIVE_OP.CLAIM_REWARD_BALANCE) {
      let total = 0;
      const p = row.payload;
      const hbd = asString(p.reward_hbd);
      const hive = asString(p.reward_hive);
      const vests = toVestPayload(p.reward_vests);
      if (hbd) {
        total += this.assetUsd(hbd, hiveUsd, hbdUsd);
      }
      if (hive) {
        total += this.assetUsd(hive, hiveUsd, hbdUsd);
      }
      if (vests) {
        const hp = vestToHp(
          vests,
          chainContext.totalVestingShares,
          chainContext.totalVestingFundSteem,
        );
        total += hp * hiveUsd;
      }
      return total;
    }

    if (row.type === HIVE_OP.FILL_ORDER || row.type === HIVE_OP.LIMIT_ORDER_CANCEL) {
      const parts = row.amount.split('/').map((p) => p.trim());
      return parts.reduce((sum, part) => sum + this.assetUsd(part, hiveUsd, hbdUsd), 0);
    }

    return this.assetUsd(row.amount, hiveUsd, hbdUsd);
  }

  private assetUsd(amount: string, hiveUsd: number, hbdUsd: number): number {
    const parsed = parseAssetAmount(amount);
    if (!parsed) {
      return 0;
    }
    const rate = parsed.currency === 'HBD' ? hbdUsd : hiveUsd;
    return parsed.amount * rate;
  }

  private assetFiat(
    amount: string,
    hiveUsd: number,
    hbdUsd: number,
    fiatCross: number,
    symbol: 'HIVE' | 'HBD',
  ): number {
    const parsed = parseAssetAmount(amount);
    if (!parsed || parsed.currency !== symbol) {
      return 0;
    }
    const rate = symbol === 'HBD' ? hbdUsd : hiveUsd;
    return parsed.amount * rate * fiatCross;
  }

  private hpFiatFromRow(
    row: AdvancedReportRawRow,
    hiveUsd: number,
    fiatCross: number,
    chainContext: { totalVestingShares: string; totalVestingFundSteem: string },
  ): number {
    if (row.type !== HIVE_OP.CLAIM_REWARD_BALANCE) {
      const parsed = parseAssetAmount(row.amount);
      if (parsed?.currency === 'VESTS' || parsed?.currency.includes('VESTS')) {
        const hp = vestToHp(
          row.amount,
          chainContext.totalVestingShares,
          chainContext.totalVestingFundSteem,
        );
        return hp * hiveUsd * fiatCross;
      }
      return 0;
    }
    const vests = toVestPayload(row.payload.reward_vests);
    if (!vests) {
      return 0;
    }
    const hp = vestToHp(
      vests,
      chainContext.totalVestingShares,
      chainContext.totalVestingFundSteem,
    );
    return hp * hiveUsd * fiatCross;
  }
}

import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';

export type WaivAdvancedReportDisplayAmounts = {
  waivAmount: string;
  wpAmount: string;
};

export function splitWaivAdvancedReportDisplayAmounts(
  row: WaivAdvancedReportRawRow,
): WaivAdvancedReportDisplayAmounts {
  const amount = row.amount.trim();
  if (!amount) {
    return { waivAmount: '', wpAmount: '' };
  }

  switch (row.type) {
    case 'tokens_stake':
      return { waivAmount: '', wpAmount: amount };
    default:
      return { waivAmount: amount, wpAmount: '' };
  }
}

function parseNumericAmount(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : 0;
}

export function waivQuantityForPricing(row: WaivAdvancedReportRawRow): number {
  return parseNumericAmount(row.amount);
}

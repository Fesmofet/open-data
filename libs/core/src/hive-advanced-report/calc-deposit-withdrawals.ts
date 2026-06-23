export type AdvancedReportTotalsRow = {
  withdrawDeposit: '' | 'd' | 'w';
  checked?: boolean;
  totalFiat: number;
};

export type DepositWithdrawalsTotals = {
  deposits: number;
  withdrawals: number;
};

/**
 * Sums fiat totals for rows included in deposit/withdraw buckets.
 * Skips rows with empty withdrawDeposit or checked exemptions.
 */
export function calcDepositWithdrawals(
  rows: readonly AdvancedReportTotalsRow[],
): DepositWithdrawalsTotals {
  return rows.reduce<DepositWithdrawalsTotals>(
    (acc, row) => {
      if (row.checked || row.withdrawDeposit === '') {
        return acc;
      }
      const amount = Number.isFinite(row.totalFiat) ? row.totalFiat : 0;
      if (row.withdrawDeposit === 'w') {
        acc.withdrawals += amount;
      } else if (row.withdrawDeposit === 'd') {
        acc.deposits += amount;
      }
      return acc;
    },
    { deposits: 0, withdrawals: 0 },
  );
}

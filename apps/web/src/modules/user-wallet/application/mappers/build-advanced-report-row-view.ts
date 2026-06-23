import { HIVE_OP } from '@opden-data-layer/core/hive-account-history';

import type { AdvancedReportRowApi } from '../dto/hive-advanced-report-api.schema';

export type AdvancedReportRowView = {
  id: string;
  userName: string;
  operationIndex: number;
  timestamp: number;
  dateLabel: string;
  timeLabel: string;
  hiveAmount: string;
  hbdAmount: string;
  hpAmount: string;
  hiveFiat: number;
  hbdFiat: number;
  hiveRateFiat: number;
  hbdRateFiat: number;
  hpFiat: number;
  hiveUsd: number;
  hbdUsd: number;
  totalFiat: number;
  withdrawDeposit: '' | 'd' | 'w';
  checked: boolean;
  description: string;
  memo: string;
};

function formatUtcDate(unix: number): { date: string; time: string } {
  const d = new Date(unix * 1000);
  const date = `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return { date, time };
}

function buildDescription(row: AdvancedReportRowApi): string {
  switch (row.type) {
    case HIVE_OP.TRANSFER:
      return row.withdrawDeposit === 'd'
        ? `Received from @${row.from}`
        : `Sent to @${row.to}`;
    case HIVE_OP.TRANSFER_TO_VESTING:
      if (row.from === row.to) {
        return 'Power up';
      }
      return row.withdrawDeposit === 'd'
        ? `Power up from @${row.from}`
        : `Power up to @${row.to}`;
    case HIVE_OP.FILL_VESTING_WITHDRAW:
      return row.withdrawDeposit === 'd'
        ? `Power down from @${row.from}`
        : `Power down to @${row.to}`;
    case HIVE_OP.CLAIM_REWARD_BALANCE:
      return 'Claim rewards';
    case HIVE_OP.INTEREST:
      return 'HBD savings interest';
    case HIVE_OP.PROPOSAL_PAY:
      return 'Proposal pay';
    case HIVE_OP.FILL_ORDER:
      return 'Market order filled';
    case HIVE_OP.LIMIT_ORDER_CANCEL:
      return 'Limit order canceled';
    default:
      return row.type;
  }
}

export function buildAdvancedReportRowView(row: AdvancedReportRowApi): AdvancedReportRowView {
  const { date, time } = formatUtcDate(row.timestamp);

  return {
    id: `${row.userName}:${row.operationIndex}`,
    userName: row.userName,
    operationIndex: row.operationIndex,
    timestamp: row.timestamp,
    dateLabel: date,
    timeLabel: time,
    hiveAmount: row.hiveAmount,
    hbdAmount: row.hbdAmount,
    hpAmount: row.hpAmount,
    hiveFiat: row.hiveFiat,
    hbdFiat: row.hbdFiat,
    hiveRateFiat: row.hiveRateFiat,
    hbdRateFiat: row.hbdRateFiat,
    hpFiat: row.hpFiat,
    hiveUsd: row.hiveUsd,
    hbdUsd: row.hbdUsd,
    totalFiat: row.totalFiat,
    withdrawDeposit: row.withdrawDeposit,
    checked: row.checked,
    description: buildDescription(row),
    memo: row.memo,
  };
}

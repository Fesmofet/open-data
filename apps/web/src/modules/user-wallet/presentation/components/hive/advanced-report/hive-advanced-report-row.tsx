'use client';

import Link from 'next/link';
import { memo, useMemo, type CSSProperties } from 'react';

import type { AdvancedReportRowApi } from '../../../../application/dto/hive-advanced-report-api.schema';
import {
  buildAdvancedReportRowView,
  type AdvancedReportRowView,
} from '../../../../application/mappers/build-advanced-report-row-view';
import { formatAdvancedReportTotal } from './format-advanced-report-total';

type HiveAdvancedReportRowProps = {
  rowApi: AdvancedReportRowApi;
  canToggleExemption: boolean;
  onToggleExemption: (row: AdvancedReportRowView, checked: boolean) => void;
  style?: CSSProperties;
  dataIndex?: number;
  measureRef?: (element: Element | null) => void;
};

function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '';
  }
  return value.toFixed(3);
}

export const HiveAdvancedReportRow = memo(function HiveAdvancedReportRow({
  rowApi,
  canToggleExemption,
  onToggleExemption,
  style,
  dataIndex,
  measureRef,
}: HiveAdvancedReportRowProps) {
  const row = useMemo(() => buildAdvancedReportRowView(rowApi), [rowApi]);

  return (
    <tr
      ref={measureRef}
      data-index={dataIndex}
      style={style}
      className="border-b border-border text-body-sm even:bg-surface-control/40"
    >
      <td className="px-2 py-2 align-top">
        {canToggleExemption ? (
          <input
            type="checkbox"
            checked={row.checked}
            aria-label="Exclude from totals"
            onChange={(e) => onToggleExemption(row, e.target.checked)}
          />
        ) : null}
      </td>
      <td className="px-2 py-2 align-top whitespace-nowrap tabular-nums">
        <div>{row.dateLabel}</div>
        <div className="text-muted">{row.timeLabel}</div>
      </td>
      <td className="px-2 py-2 align-top tabular-nums">{row.hiveAmount}</td>
      <td className="px-2 py-2 align-top tabular-nums">{row.hpAmount}</td>
      <td className="px-2 py-2 align-top tabular-nums">{row.hbdAmount}</td>
      <td className="px-2 py-2 align-top tabular-nums">{formatAmount(row.hiveRateFiat)}</td>
      <td className="px-2 py-2 align-top tabular-nums">{formatAmount(row.hbdRateFiat)}</td>
      <td className="px-2 py-2 align-top uppercase text-muted">
        {row.withdrawDeposit}
      </td>
      <td className="px-2 py-2 align-top">
        <Link href={`/@${row.userName}`} className="text-link">
          @{row.userName}
        </Link>
      </td>
      <td className="px-2 py-2 align-top">{row.description}</td>
      <td className="px-2 py-2 align-top break-all text-muted">{row.memo}</td>
    </tr>
  );
});

export function advancedReportRowToCsvCells(
  row: AdvancedReportRowView,
  currency: string,
): string[] {
  return [
    row.checked ? '1' : '0',
    row.dateLabel,
    row.hiveAmount,
    row.hpAmount,
    row.hbdAmount,
    row.hiveRateFiat ? row.hiveRateFiat.toFixed(3) : '',
    row.hbdRateFiat ? row.hbdRateFiat.toFixed(3) : '',
    row.withdrawDeposit,
    row.userName,
    row.description.replaceAll(',', ' '),
    row.memo.replaceAll(',', ' '),
  ];
}

export function buildAdvancedReportCsv(
  rows: AdvancedReportRowView[],
  currency: string,
  deposits: number | null,
  withdrawals: number | null,
): string {
  const header = [
    'X',
    'Date',
    'HIVE',
    'HP',
    'HBD',
    `HIVE/${currency}`,
    `HBD/${currency}`,
    '±',
    'Account',
    'Description',
    'Memo',
  ];
  const lines = [
    header.join(','),
    ...rows.map((row) => advancedReportRowToCsvCells(row, currency).join(',')),
  ];
  if (deposits != null && withdrawals != null) {
    lines.unshift(
      [
        'Total Deposits',
        formatAdvancedReportTotal(deposits, currency),
        'Total Withdrawals',
        formatAdvancedReportTotal(withdrawals, currency),
      ].join(','),
    );
  }
  return lines.join('\n');
}

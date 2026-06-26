'use client';

import Link from 'next/link';
import { memo, useMemo, type CSSProperties } from 'react';

import type { AdvancedReportRowApi } from '../../../../application/dto/hive-advanced-report-api.schema';
import {
  buildAdvancedReportRowView,
  type AdvancedReportRowView,
} from '../../../../application/mappers/build-advanced-report-row-view';
import {
  ADVANCED_REPORT_TABLE_CELL,
  advancedReportTableGridStyle,
} from './advanced-report-table-layout';
import { formatAdvancedReportTotal } from './format-advanced-report-total';

function AdvancedReportTruncatedText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  if (!text) {
    return null;
  }

  return (
    <span className={`block truncate ${className}`.trim()} title={text}>
      {text}
    </span>
  );
}

function AdvancedReportMemoCell({ memo }: { memo: string }) {
  return <AdvancedReportTruncatedText text={memo} />;
}

function AdvancedReportDescriptionCell({
  descriptionView,
}: {
  descriptionView: AdvancedReportRowView['descriptionView'];
}) {
  if (descriptionView.kind === 'plain') {
    return <AdvancedReportTruncatedText text={descriptionView.text} />;
  }

  const fullText = `${descriptionView.label} @${descriptionView.account}`;

  return (
    <div className="min-w-0" title={fullText}>
      <div className="truncate">{descriptionView.label}</div>
      <Link
        href={`/@${descriptionView.account}`}
        className="block truncate text-link"
        suppressHydrationWarning
      >
        @{descriptionView.account}
      </Link>
    </div>
  );
}

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
    <div
      ref={measureRef}
      role="row"
      data-index={dataIndex}
      style={{ ...advancedReportTableGridStyle, ...style }}
      className="border-b border-border text-body-sm even:bg-surface-control/40"
    >
      <div role="cell" className={ADVANCED_REPORT_TABLE_CELL}>
        {canToggleExemption ? (
          <input
            type="checkbox"
            className="size-4 shrink-0 rounded-btn border border-border accent-accent"
            checked={row.checked}
            aria-label="Exclude from totals"
            onChange={(e) => onToggleExemption(row, e.target.checked)}
          />
        ) : null}
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} whitespace-nowrap tabular-nums`}>
        <div>{row.dateLabel}</div>
        <div className="text-muted">{row.timeLabel}</div>
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {row.hiveAmount}
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {row.hpAmount}
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {row.hbdAmount}
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {formatAmount(row.hiveRateFiat)}
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {formatAmount(row.hbdRateFiat)}
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} uppercase text-muted`}>
        {row.withdrawDeposit}
      </div>
      <div role="cell" className={ADVANCED_REPORT_TABLE_CELL}>
        <Link href={`/@${row.userName}`} className="text-link" suppressHydrationWarning>
          @{row.userName}
        </Link>
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} min-w-0 overflow-hidden`}>
        <AdvancedReportDescriptionCell descriptionView={row.descriptionView} />
      </div>
      <div role="cell" className={`${ADVANCED_REPORT_TABLE_CELL} min-w-0 overflow-hidden text-muted`}>
        <AdvancedReportMemoCell memo={row.memo} />
      </div>
    </div>
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

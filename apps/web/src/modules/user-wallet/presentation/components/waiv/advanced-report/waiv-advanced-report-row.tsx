'use client';

import Link from 'next/link';
import { memo, useMemo, type CSSProperties } from 'react';

import type { WaivAdvancedReportRowApi } from '../../../../application/dto/waiv-advanced-report-api.schema';
import {
  buildWaivAdvancedReportRowView,
  type WaivAdvancedReportRowView,
} from '../../../../application/mappers/build-waiv-advanced-report-row-view';
import { formatAdvancedReportTotal } from '../../hive/advanced-report/format-advanced-report-total';
import {
  WAIV_ADVANCED_REPORT_TABLE_CELL,
  waivAdvancedReportTableGridStyle,
} from './waiv-advanced-report-table-layout';

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

function AdvancedReportDescriptionCell({
  descriptionView,
}: {
  descriptionView: WaivAdvancedReportRowView['descriptionView'];
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

type WaivAdvancedReportRowProps = {
  rowApi: WaivAdvancedReportRowApi;
  canToggleExemption: boolean;
  onToggleExemption: (row: WaivAdvancedReportRowView, checked: boolean) => void;
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

export const WaivAdvancedReportRow = memo(function WaivAdvancedReportRow({
  rowApi,
  canToggleExemption,
  onToggleExemption,
  style,
  dataIndex,
  measureRef,
}: WaivAdvancedReportRowProps) {
  const row = useMemo(() => buildWaivAdvancedReportRowView(rowApi), [rowApi]);

  return (
    <div
      ref={measureRef}
      role="row"
      data-index={dataIndex}
      style={{ ...waivAdvancedReportTableGridStyle, ...style }}
      className="border-b border-border text-body-sm even:bg-surface-control/40"
    >
      <div role="cell" className={WAIV_ADVANCED_REPORT_TABLE_CELL}>
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
      <div role="cell" className={`${WAIV_ADVANCED_REPORT_TABLE_CELL} whitespace-nowrap tabular-nums`}>
        <div>{row.dateLabel}</div>
        <div className="text-muted">{row.timeLabel}</div>
      </div>
      <div role="cell" className={`${WAIV_ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {row.waivAmount}
      </div>
      <div role="cell" className={`${WAIV_ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {row.wpAmount}
      </div>
      <div role="cell" className={`${WAIV_ADVANCED_REPORT_TABLE_CELL} tabular-nums`}>
        {formatAmount(row.waivRateFiat)}
      </div>
      <div role="cell" className={`${WAIV_ADVANCED_REPORT_TABLE_CELL} uppercase text-muted`}>
        {row.withdrawDeposit}
      </div>
      <div role="cell" className={WAIV_ADVANCED_REPORT_TABLE_CELL}>
        <Link href={`/@${row.userName}`} className="text-link" suppressHydrationWarning>
          @{row.userName}
        </Link>
      </div>
      <div role="cell" className={`${WAIV_ADVANCED_REPORT_TABLE_CELL} min-w-0 overflow-hidden`}>
        <AdvancedReportDescriptionCell descriptionView={row.descriptionView} />
      </div>
      <div role="cell" className={`${WAIV_ADVANCED_REPORT_TABLE_CELL} min-w-0 overflow-hidden text-muted`}>
        <AdvancedReportTruncatedText text={row.memo} />
      </div>
    </div>
  );
});

export function waivAdvancedReportRowToCsvCells(
  row: WaivAdvancedReportRowView,
  currency: string,
): string[] {
  return [
    row.checked ? '1' : '0',
    row.dateLabel,
    row.waivAmount,
    row.wpAmount,
    row.waivRateFiat ? row.waivRateFiat.toFixed(3) : '',
    row.withdrawDeposit,
    row.userName,
    row.description.replaceAll(',', ' '),
    row.memo.replaceAll(',', ' '),
  ];
}

export function buildWaivAdvancedReportCsv(
  rows: WaivAdvancedReportRowView[],
  currency: string,
  deposits: number | null,
  withdrawals: number | null,
): string {
  const header = [
    'X',
    'Date',
    'WAIV',
    'WP',
    `WAIV/${currency}`,
    '±',
    'Account',
    'Description',
    'Memo',
  ];
  const lines = [
    header.join(','),
    ...rows.map((row) => waivAdvancedReportRowToCsvCells(row, currency).join(',')),
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

/** Matches former Tailwind th widths (w-10 … w-40) + flexible memo column. */
export const ADVANCED_REPORT_GRID_TEMPLATE_COLUMNS =
  '2.5rem 7rem 5rem 5rem 5rem 6rem 6rem 2.5rem 7rem 10rem minmax(0, 1fr)';

export const ADVANCED_REPORT_TABLE_CELL = 'px-2 py-2 align-top';

/** Header cell — row group is sticky, not individual cells. */
export const ADVANCED_REPORT_TABLE_HEAD_CELL = `${ADVANCED_REPORT_TABLE_CELL} bg-surface-control`;

export const advancedReportTableGridStyle = {
  display: 'grid',
  gridTemplateColumns: ADVANCED_REPORT_GRID_TEMPLATE_COLUMNS,
} as const;

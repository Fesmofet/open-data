/** WAIV table: no HBD / HBD rate columns. */
export const WAIV_ADVANCED_REPORT_GRID_TEMPLATE_COLUMNS =
  '2.5rem 7rem 5rem 5rem 6rem 2.5rem 7rem 10rem minmax(0, 1fr)';

export const WAIV_ADVANCED_REPORT_TABLE_CELL = 'px-2 py-2 align-top';

export const WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL = `${WAIV_ADVANCED_REPORT_TABLE_CELL} bg-surface-control`;

export const waivAdvancedReportTableGridStyle = {
  display: 'grid',
  gridTemplateColumns: WAIV_ADVANCED_REPORT_GRID_TEMPLATE_COLUMNS,
} as const;

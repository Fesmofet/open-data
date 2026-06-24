export function ymdToUnixStart(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 1000);
}

export function ymdToUnixEnd(ymd: string): number {
  return ymdToUnixStart(ymd) + 86_399;
}

export function unixToYmd(unix: number): string {
  const d = new Date(unix * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Latest selectable Till date (last complete UTC day before now). */
export function maxAdvancedReportTillYmd(nowSec = Math.floor(Date.now() / 1000)): string {
  const d = new Date(nowSec * 1000);
  const yesterdayUtc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - 1,
  );
  return unixToYmd(Math.floor(yesterdayUtc / 1000));
}

export type AdvancedReportDateRangeError = 'till_before_from' | 'till_in_future';

export function validateAdvancedReportDateRange(
  startDate: string,
  endDate: string,
  nowSec = Math.floor(Date.now() / 1000),
): AdvancedReportDateRangeError | null {
  if (!startDate.trim() || !endDate.trim()) {
    return null;
  }
  if (endDate < startDate) {
    return 'till_before_from';
  }
  if (ymdToUnixEnd(endDate) >= nowSec) {
    return 'till_in_future';
  }
  return null;
}

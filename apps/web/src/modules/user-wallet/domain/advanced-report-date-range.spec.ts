import {
  maxAdvancedReportTillYmd,
  validateAdvancedReportDateRange,
  ymdToUnixEnd,
  ymdToUnixStart,
} from './advanced-report-date-range';

describe('validateAdvancedReportDateRange', () => {
  const nowSec = Math.floor(Date.parse('2024-06-15T12:00:00Z') / 1000);

  it('rejects till before from', () => {
    expect(
      validateAdvancedReportDateRange('2024-06-10', '2024-06-01', nowSec),
    ).toBe('till_before_from');
  });

  it('accepts valid range ending on last complete UTC day', () => {
    expect(
      validateAdvancedReportDateRange('2024-06-01', '2024-06-14', nowSec),
    ).toBeNull();
  });

  it('rejects till on or after today UTC', () => {
    expect(
      validateAdvancedReportDateRange('2024-06-01', '2024-06-15', nowSec),
    ).toBe('till_in_future');
  });

  it('maxAdvancedReportTillYmd is yesterday UTC', () => {
    expect(maxAdvancedReportTillYmd(nowSec)).toBe('2024-06-14');
  });

  it('ymd helpers align start/end of day', () => {
    expect(ymdToUnixEnd('2024-06-01')).toBe(ymdToUnixStart('2024-06-01') + 86_399);
  });
});

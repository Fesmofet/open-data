import { formatAdvancedReportTotal } from './format-advanced-report-total';

describe('formatAdvancedReportTotal', () => {
  it('formats USD with symbol, comma grouping, 2 decimals', () => {
    expect(formatAdvancedReportTotal(1881.607, 'USD')).toBe('$1,881.61');
    expect(formatAdvancedReportTotal(391.037, 'USD')).toBe('$391.04');
  });

  it('returns dash for null', () => {
    expect(formatAdvancedReportTotal(null, 'USD')).toBe('-');
  });
});

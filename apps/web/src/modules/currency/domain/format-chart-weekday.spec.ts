import { formatChartWeekdayLabel } from './format-chart-weekday';

describe('formatChartWeekdayLabel', () => {
  it('formats YYYY-MM-DD as short weekday', () => {
    expect(formatChartWeekdayLabel('2026-07-07', 'en-US')).toBe('Tue');
  });

  it('formats ISO datetime', () => {
    expect(formatChartWeekdayLabel('2026-07-06T12:00:00.000Z', 'en-US')).toBe('Mon');
  });

  it('returns empty for invalid input', () => {
    expect(formatChartWeekdayLabel('', 'en-US')).toBe('');
  });
});

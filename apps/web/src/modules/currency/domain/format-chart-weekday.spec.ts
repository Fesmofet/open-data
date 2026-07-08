import { formatChartHoverLabel, formatChartWeekdayLabel } from './format-chart-weekday';

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

describe('formatChartHoverLabel', () => {
  it('formats YYYY-MM-DD with weekday and calendar date', () => {
    expect(formatChartHoverLabel('2026-07-07', 'en-US')).toBe('Tue, Jul 7, 2026');
  });

  it('formats ISO datetime', () => {
    expect(formatChartHoverLabel('2026-07-06T12:00:00.000Z', 'en-US')).toBe(
      'Mon, Jul 6, 2026',
    );
  });

  it('returns trimmed input for invalid values', () => {
    expect(formatChartHoverLabel('  n/a  ', 'en-US')).toBe('n/a');
  });
});

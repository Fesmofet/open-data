/** ISO date or datetime → short weekday label (e.g. Wed). */
export function formatChartWeekdayLabel(
  dateInput: string,
  locale = 'en-US',
): string {
  const trimmed = dateInput.trim();

  if (!trimmed) {
    return '';
  }

  const dateOnly = trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
  const parsed = new Date(`${dateOnly}T12:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
    parsed,
  );
}

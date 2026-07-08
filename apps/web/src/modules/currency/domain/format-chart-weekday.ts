function parseChartDateInput(dateInput: string): Date | null {
  const trimmed = dateInput.trim();

  if (!trimmed) {
    return null;
  }

  const dateOnly = trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
  const parsed = new Date(`${dateOnly}T12:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/** ISO date or datetime → short weekday label (e.g. Wed). */
export function formatChartWeekdayLabel(
  dateInput: string,
  locale = 'en-US',
): string {
  const parsed = parseChartDateInput(dateInput);

  if (!parsed) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
    parsed,
  );
}

/** ISO date or datetime → weekday + calendar date for chart hover tooltips. */
export function formatChartHoverLabel(
  dateInput: string,
  locale = 'en-US',
): string {
  const parsed = parseChartDateInput(dateInput);

  if (!parsed) {
    return dateInput.trim();
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

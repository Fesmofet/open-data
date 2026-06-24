import {
  buildDailyHiveTimeline,
  currencyRatesRowYmd,
  parseCurrencyRateValue,
  resolveFiatCrossByDates,
  resolveHiveHistoricalUsdByDates,
  resolveNearestDailyHiveRate,
} from './currency-historical-rates';

function dailyRow(ymd: string, hiveUsd: number, hbdUsd = 1) {
  return {
    created_at: new Date(`${ymd}T12:00:00.000Z`),
    hive_usd: hiveUsd,
    hbd_usd: hbdUsd,
  };
}

function utcYmdToday(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

describe('currency-historical-rates', () => {
  it('normalizes PG currency_rates.date Date objects to YYYY-MM-DD', () => {
    expect(currencyRatesRowYmd(new Date('2021-10-30T00:00:00.000Z'))).toBe('2021-10-30');
    expect(currencyRatesRowYmd('2021-10-30')).toBe('2021-10-30');
  });

  it('parses PG NUMERIC fiat quotes, treating non-positive as 0', () => {
    expect(parseCurrencyRateValue('1.35965900')).toBeCloseTo(1.359659, 6);
    expect(parseCurrencyRateValue(0)).toBe(0);
    expect(parseCurrencyRateValue(null)).toBe(0);
  });

  it('resolveFiatCrossByDates uses exact day when present (legacy exact match)', () => {
    const exactByYmd = new Map([
      ['2021-03-10', 1.25],
      ['2021-03-12', 1.3],
    ]);

    const rates = resolveFiatCrossByDates({
      datesYmd: ['2021-03-10'],
      todayYmd: '2099-01-01',
      todaySpot: null,
      exactByYmd,
    });

    expect(rates.get('2021-03-10')).toBe(1.25);
  });

  it('resolveFiatCrossByDates returns 0 for a missing day (no carry-back, legacy parity)', () => {
    const exactByYmd = new Map([
      ['2021-03-10', 1.25],
      ['2021-03-12', 1.3],
    ]);

    const rates = resolveFiatCrossByDates({
      datesYmd: ['2021-03-11'],
      todayYmd: '2099-01-01',
      todaySpot: null,
      exactByYmd,
    });

    expect(rates.get('2021-03-11')).toBe(0);
  });

  it('resolveFiatCrossByDates uses latest spot for today when no stored row', () => {
    const rates = resolveFiatCrossByDates({
      datesYmd: ['2099-01-01'],
      todayYmd: '2099-01-01',
      todaySpot: 1.4,
      exactByYmd: new Map(),
    });

    expect(rates.get('2099-01-01')).toBe(1.4);
  });

  it('returns exact daily rate for a date in DB', () => {
    const timeline = buildDailyHiveTimeline([dailyRow('2021-03-10', 1.5)], null, '2099-01-01');
    const dailyByYmd = new Map(timeline.map((e) => [e.ymd, e]));

    const rates = resolveHiveHistoricalUsdByDates({
      datesYmd: ['2021-03-10'],
      timeline,
      todayYmd: '2099-01-01',
      todayRates: null,
      dailyByYmd,
    });

    expect(rates.get('2021-03-10')).toEqual({ hiveUsd: 1.5, hbdUsd: 1 });
  });

  it('carry-backs to the prior daily rate for a gap day', () => {
    const timeline = buildDailyHiveTimeline(
      [dailyRow('2021-03-10', 1.5), dailyRow('2021-03-12', 2)],
      null,
      '2099-01-01',
    );

    expect(resolveNearestDailyHiveRate('2021-03-11', timeline)).toEqual({
      ymd: '2021-03-10',
      hiveUsd: 1.5,
      hbdUsd: 1,
    });
  });

  it('carry-forwards to the first daily rate when date is before series start', () => {
    const timeline = buildDailyHiveTimeline([dailyRow('2021-03-10', 1.5)], null, '2099-01-01');
    const dailyByYmd = new Map(timeline.map((e) => [e.ymd, e]));

    const rates = resolveHiveHistoricalUsdByDates({
      datesYmd: ['2020-06-23'],
      timeline,
      todayYmd: '2099-01-01',
      todayRates: null,
      dailyByYmd,
    });

    expect(rates.get('2020-06-23')).toEqual({ hiveUsd: 1.5, hbdUsd: 1 });
  });

  it('uses anchor before min date for carry-back across range boundary', () => {
    const timeline = buildDailyHiveTimeline(
      [dailyRow('2021-03-10', 1.5)],
      dailyRow('2020-06-01', 0.4),
      '2099-01-01',
    );
    const dailyByYmd = new Map(timeline.map((e) => [e.ymd, e]));

    const rates = resolveHiveHistoricalUsdByDates({
      datesYmd: ['2020-12-01'],
      timeline,
      todayYmd: '2099-01-01',
      todayRates: null,
      dailyByYmd,
    });

    expect(rates.get('2020-12-01')).toEqual({ hiveUsd: 0.4, hbdUsd: 1 });
  });

  it('uses spot for today, not the daily DB row', () => {
    const today = utcYmdToday();
    const timeline = buildDailyHiveTimeline([dailyRow(today, 0.11)], null, today);
    const dailyByYmd = new Map(timeline.map((e) => [e.ymd, e]));

    const rates = resolveHiveHistoricalUsdByDates({
      datesYmd: [today],
      timeline,
      todayYmd: today,
      todayRates: { hiveUsd: 0.99, hbdUsd: 1 },
      dailyByYmd,
    });

    expect(rates.get(today)).toEqual({ hiveUsd: 0.99, hbdUsd: 1 });
  });

  it('returns zero for past dates when timeline is empty', () => {
    const rates = resolveHiveHistoricalUsdByDates({
      datesYmd: ['2020-06-23'],
      timeline: [],
      todayYmd: '2099-01-01',
      todayRates: null,
      dailyByYmd: new Map(),
    });

    expect(rates.get('2020-06-23')).toEqual({ hiveUsd: 0, hbdUsd: 0 });
  });
});

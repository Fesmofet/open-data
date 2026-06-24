import { hiveTimestampToYmd, minYmd } from './hive-timestamp-to-ymd';

describe('hiveTimestampToYmd', () => {
  it('parses Hive condenser timestamp to UTC YMD', () => {
    expect(hiveTimestampToYmd('2020-06-18T15:10:30')).toBe('2020-06-18');
  });

  it('returns null for empty or invalid input', () => {
    expect(hiveTimestampToYmd('')).toBeNull();
    expect(hiveTimestampToYmd('not-a-date')).toBeNull();
  });
});

describe('minYmd', () => {
  it('returns earliest non-null YMD', () => {
    expect(minYmd(['2021-01-01', null, '2020-06-18', '2022-03-01'])).toBe('2020-06-18');
  });

  it('returns null when all values are missing', () => {
    expect(minYmd([null, undefined, ''])).toBeNull();
  });
});

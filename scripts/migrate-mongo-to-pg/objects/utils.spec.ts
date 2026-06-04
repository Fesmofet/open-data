import { parseMongoCreatedAt } from './utils';

describe('parseMongoCreatedAt', () => {
  it('parses ISO string', () => {
    const d = parseMongoCreatedAt('2019-04-11T13:33:22.034+00:00');
    expect(d?.toISOString()).toBe('2019-04-11T13:33:22.034Z');
  });

  it('parses Mongo extended JSON $date string', () => {
    const d = parseMongoCreatedAt({ $date: '2019-04-11T13:33:22.034Z' });
    expect(d?.toISOString()).toBe('2019-04-11T13:33:22.034Z');
  });

  it('parses Mongo extended JSON $date milliseconds', () => {
    const d = parseMongoCreatedAt({ $date: 1_554_989_602_034 });
    expect(d?.toISOString()).toBe('2019-04-11T13:33:22.034Z');
  });

  it('returns undefined for invalid values', () => {
    expect(parseMongoCreatedAt({ $date: 'not-a-date' })).toBeUndefined();
    expect(parseMongoCreatedAt('')).toBeUndefined();
  });
});

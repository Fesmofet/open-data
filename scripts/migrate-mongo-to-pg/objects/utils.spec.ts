import {
  compareMongoObjectIdHex,
  legacyEventSeqFromObjectIdHex,
  mongoActiveVotesHasVoter,
  parseMongoCreatedAt,
} from './utils';

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

describe('legacyEventSeqFromObjectIdHex', () => {
  it('returns block-0 values below first real Hive block', () => {
    const seq = legacyEventSeqFromObjectIdHex('622e6c74e48e7448ee3a54f2');
    expect(seq).toBeGreaterThan(0n);
    expect(seq).toBeLessThan(67_108_864n);
  });

  it('orders later legacy votes after earlier ones (versentry then dataoperator)', () => {
    const versentryVote = legacyEventSeqFromObjectIdHex('622e6c7ab8407648f662d73c');
    const dataoperatorVote = legacyEventSeqFromObjectIdHex('631a58254aea5014d452dd2a');
    expect(dataoperatorVote).toBeGreaterThan(versentryVote);
  });
});

describe('mongoActiveVotesHasVoter', () => {
  it('returns false for undefined or empty votes', () => {
    expect(mongoActiveVotesHasVoter(undefined, 'alice')).toBe(false);
    expect(mongoActiveVotesHasVoter([], 'alice')).toBe(false);
  });

  it('matches voter after trim', () => {
    expect(mongoActiveVotesHasVoter([{ voter: ' alice ' }], 'alice')).toBe(true);
    expect(mongoActiveVotesHasVoter([{ voter: 'bob' }], 'alice')).toBe(false);
  });

  it('returns true for any creator entry regardless of percent', () => {
    expect(mongoActiveVotesHasVoter([{ voter: 'alice' }], 'alice')).toBe(true);
  });
});

describe('compareMongoObjectIdHex', () => {
  it('sorts vote ObjectIds chronologically', () => {
    expect(
      compareMongoObjectIdHex('622e6c7ab8407648f662d73c', '631a58254aea5014d452dd2a'),
    ).toBeLessThan(0);
  });
});

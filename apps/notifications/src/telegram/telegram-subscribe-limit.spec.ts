import { planChatSubscriptions } from './telegram-subscribe-limit';

describe('planChatSubscriptions', () => {
  const max = 10;

  it('allows new names up to free slots', () => {
    const current = Array.from({ length: 8 }, (_, i) => `user${i}`);
    const { namesToSubscribe, limitRejected } = planChatSubscriptions(
      current,
      ['alice', 'bob', 'carol'],
      max,
    );
    expect(namesToSubscribe).toEqual(['alice', 'bob']);
    expect(limitRejected).toEqual(['carol']);
  });

  it('re-subscribes existing accounts without using slots', () => {
    const { namesToSubscribe, limitRejected } = planChatSubscriptions(
      Array.from({ length: 10 }, (_, i) => `user${i}`),
      ['user0', 'newguy'],
      max,
    );
    expect(namesToSubscribe).toEqual(['user0']);
    expect(limitRejected).toEqual(['newguy']);
  });

  it('rejects all new when at cap', () => {
    const current = Array.from({ length: 10 }, (_, i) => `user${i}`);
    const { namesToSubscribe, limitRejected } = planChatSubscriptions(
      current,
      ['alice'],
      max,
    );
    expect(namesToSubscribe).toEqual([]);
    expect(limitRejected).toEqual(['alice']);
  });
});

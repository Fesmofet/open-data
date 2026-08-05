import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { coalesceVoteLikeEvents } from './coalesce-vote-like-events';

function voteLike(
  author: string,
  voter: string,
  likesCount: number,
  blockNum = 1,
): AnyNotificationEvent {
  return {
    type: 'vote_like',
    occurredAt: '2026-01-01T00:00:00.000Z',
    blockNum,
    trxId: null,
    objectId: null,
    actor: voter,
    payload: {
      voter,
      author,
      permlink: 'p',
      weight: 10_000,
      title: 'Post title',
      likesCount,
    },
  } as AnyNotificationEvent;
}

describe('coalesceVoteLikeEvents', () => {
  it('returns the same array when there are no vote_like events', () => {
    const events = [
      {
        type: 'follow',
        occurredAt: '2026-01-01T00:00:00.000Z',
        blockNum: 1,
        trxId: null,
        objectId: null,
        actor: 'alice',
        payload: { following: 'bob', action: 'follow' },
      },
    ] as AnyNotificationEvent[];

    expect(coalesceVoteLikeEvents(events)).toEqual(events);
  });

  it('keeps only the last vote_like per post within the batch', () => {
    const events = [
      voteLike('author1', 'alice', 0, 1),
      voteLike('author1', 'bob', 1, 2),
      voteLike('author2', 'carol', 0, 3),
      voteLike('author1', 'dave', 2, 4),
    ];

    expect(coalesceVoteLikeEvents(events)).toEqual([
      voteLike('author2', 'carol', 0, 3),
      voteLike('author1', 'dave', 2, 4),
    ]);
  });

  it('preserves non-like event order around coalesced likes', () => {
    const follow = {
      type: 'follow',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: null,
      objectId: null,
      actor: 'alice',
      payload: { following: 'bob', action: 'follow' },
    } as AnyNotificationEvent;

    const events = [
      follow,
      voteLike('author1', 'alice', 0, 1),
      voteLike('author1', 'bob', 1, 2),
    ];

    expect(coalesceVoteLikeEvents(events)).toEqual([
      follow,
      voteLike('author1', 'bob', 1, 2),
    ]);
  });
});

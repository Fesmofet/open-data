import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import { buildNotificationMessage } from './registry';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('buildNotificationMessage', () => {
  it('builds follow message', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'follow',
      payload: { following: 'bob', action: 'follow' },
    });
    expect(msg.key).toBe('notification_following_username');
    expect(msg.params['username']).toBe('alice');
  });

  it('builds transfer_in message', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'transfer_in',
      actor: 'sender',
      payload: {
        from: 'sender',
        to: 'bob',
        amount: '1.000',
        symbol: 'HIVE',
        memo: null,
      },
    });
    expect(msg.key).toBe('notification_transfer_username_amount');
    expect(msg.href).toContain('/transfers');
  });

  it('returns generic for unknown handling gaps', () => {
    const msg = buildNotificationMessage({
      ...baseEnvelope,
      type: 'trx_processed',
      actor: null,
      payload: {},
    });
    expect(msg.key).toBe('notification_generic_default_message');
  });

  it('covers every declared event type without throwing', () => {
    for (const type of NOTIFICATION_EVENT_TYPES) {
      const event = {
        ...baseEnvelope,
        type,
        payload: minimalPayload(type),
      } as Parameters<typeof buildNotificationMessage>[0];
      expect(() => buildNotificationMessage(event)).not.toThrow();
    }
  });
});

function minimalPayload(
  type: (typeof NOTIFICATION_EVENT_TYPES)[number],
): Record<string, unknown> {
  switch (type) {
    case 'reply':
      return {
        author: 'a',
        permlink: 'p',
        parentAuthor: 'b',
        parentPermlink: 'pp',
        isRootPost: false,
      };
    case 'mention':
      return { author: 'a', permlink: 'p', isRootPost: true, mentioned: 'bob' };
    case 'my_post':
      return { author: 'a', permlink: 'p', title: 't' };
    case 'my_comment':
      return { author: 'a', permlink: 'p', parentAuthor: 'b' };
    case 'vote_like':
    case 'vote_downvote':
      return { voter: 'v', author: 'a', permlink: 'p', weight: 1 };
    case 'my_vote':
      return { voter: 'v', author: 'a', permlink: 'p', title: null };
    case 'reblog':
    case 'bell_reblog':
      return { account: 'a', author: 'b', permlink: 'p', title: null };
    case 'follow':
      return { following: 'b', action: 'follow' };
    case 'bell_post':
      return { author: 'a', permlink: 'p', title: 't' };
    case 'bell_follow':
      return { follower: 'a', following: 'b' };
    case 'bell_object_post':
      return {
        author: 'a',
        permlink: 'p',
        title: 't',
        wobjectPermlink: 'w',
        wobjectName: 'W',
      };
    case 'bell_thread':
      return { author: 'a', permlink: 'p', authorPermlink: 'w' };
    case 'thread_author_follower':
      return { author: 'a', permlink: 'p', hashtags: [], mentions: [] };
    case 'transfer_in':
    case 'transfer_out':
    case 'transfer_from_savings':
      return {
        from: 'a',
        to: 'b',
        amount: '1',
        symbol: 'HIVE',
        memo: null,
      };
    case 'power_up':
      return { from: 'a', to: 'b', amount: '1' };
    case 'power_down':
      return { account: 'a', amount: '1' };
    case 'claim_reward':
      return { rewardHive: '0', rewardHbd: '0', rewardHp: '0' };
    case 'witness_vote':
      return { witness: 'w', approve: true };
    case 'fill_order':
      return {
        currentPays: '1',
        openPays: '2',
        exchanger: 'e',
        orderId: 1,
      };
    case 'withdraw_route':
      return {
        fromAccount: 'a',
        toAccount: 'b',
        percent: 50,
        autoVest: false,
      };
    case 'change_recovery_account':
      return { account: 'a', newRecoveryAccount: 'b' };
    case 'change_password':
      return { account: 'a' };
    case 'hp_delegation':
      return { delegator: 'a', delegatee: 'b', amount: '1' };
    case 'engine_transfer':
      return {
        from: 'a',
        to: 'b',
        amount: '1',
        symbol: 'WAIV',
        memo: null,
      };
    case 'engine_stake':
    case 'engine_delegate':
    case 'engine_undelegate':
      return { from: 'a', to: 'b', amount: '1', symbol: 'WAIV' };
    case 'engine_unstake':
    case 'engine_cancel_unstake':
      return { account: 'a', amount: '1', symbol: 'WAIV' };
    case 'object_update':
      return {
        updateId: 'u',
        updateType: 'title',
        objectName: 'o',
        authorPermlink: 'ap',
      };
    case 'object_update_reject':
      return {
        updateId: 'u',
        updateType: 'title',
        objectName: 'o',
        authorPermlink: 'ap',
        voter: 'v',
      };
    case 'object_status_change':
      return {
        objectName: 'o',
        authorPermlink: 'ap',
        oldStatus: 'a',
        newStatus: 'b',
        account: 'u',
      };
    case 'update_vote_cast':
      return { updateId: 'u', vote: 'upvote' };
    case 'object_created':
      return { updateId: 'u', updateType: 'title' };
    case 'batch_import_completed':
      return { cid: 'c' };
    case 'trx_processed':
      return {};
    default:
      return {};
  }
}

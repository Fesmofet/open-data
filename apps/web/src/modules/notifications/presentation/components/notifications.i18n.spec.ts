import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import { buildNotificationMessage } from '@opden-data-layer/notifications-messages';
import * as enUS from '../../../../i18n/locales/en-US.json';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

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
        updateId: 'u1',
        updateType: 'name',
        objectName: 'Obj',
        authorPermlink: 'w',
      };
    case 'object_created':
      return { updateType: 'name' };
    case 'object_update_reject':
      return {
        updateId: 'u1',
        updateType: 'name',
        objectName: 'Obj',
        authorPermlink: 'w',
        voter: 'v',
      };
    case 'object_status_change':
      return {
        account: 'a',
        objectName: 'Obj',
        authorPermlink: 'w',
        status: 'active',
      };
    case 'update_vote_cast':
      return { vote: 'for', updateId: 'u1' };
    case 'batch_import_completed':
      return { cid: 'QmTest' };
    case 'trx_processed':
      return {};
    default:
      return {};
  }
}

describe('Notifications UI i18n keys (en-US)', () => {
  it('defines shell keys for bell and page', () => {
    const keys = [
      'notifications',
      'notifications_empty_message',
      'notification_following_username',
      'notification_upvoted_username_post',
      'notification_generic_default_message',
      'see_all',
    ] as const;

    for (const key of keys) {
      const value = enUS[key];
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  it('defines en-US strings for every message-builder key', () => {
    const keys = new Set<string>();
    for (const type of NOTIFICATION_EVENT_TYPES) {
      const message = buildNotificationMessage({
        ...baseEnvelope,
        type,
        payload: minimalPayload(type),
      } as Parameters<typeof buildNotificationMessage>[0]);
      keys.add(message.key);
    }

    for (const key of keys) {
      const value = enUS[key as keyof typeof enUS];
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});

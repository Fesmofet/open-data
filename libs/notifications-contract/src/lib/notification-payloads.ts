import type { NotificationEnvelope } from './notification-envelope';

/** Feed + WS notification kinds (campaign types excluded). */
export const NOTIFICATION_EVENT_TYPES = [
  'reply',
  'mention',
  'my_post',
  'my_comment',
  'vote_like',
  'vote_downvote',
  'my_vote',
  'reblog',
  'follow',
  'bell_post',
  'bell_reblog',
  'bell_follow',
  'bell_object_post',
  'bell_thread',
  'thread_author_follower',
  'transfer_in',
  'transfer_out',
  'transfer_from_savings',
  'power_up',
  'power_down',
  'claim_reward',
  'witness_vote',
  'fill_order',
  'withdraw_route',
  'change_recovery_account',
  'change_password',
  'hp_delegation',
  'engine_transfer',
  'engine_stake',
  'engine_unstake',
  'engine_cancel_unstake',
  'engine_delegate',
  'engine_undelegate',
  'object_update',
  'object_update_reject',
  'object_status_change',
  'update_vote_cast',
  /** @deprecated Prefer `object_update`; kept for in-flight producers */
  'object_created',
  'batch_import_completed',
  'trx_processed',
] as const;

export type NotificationEventType =
  (typeof NOTIFICATION_EVENT_TYPES)[number];

export interface NotificationPayloadMap {
  reply: {
    author: string;
    permlink: string;
    parentAuthor: string;
    parentPermlink: string;
    isRootPost: boolean;
    replyToPermlink?: string | null;
    isReplyToComment?: boolean;
  };
  mention: {
    author: string;
    permlink: string;
    isRootPost: boolean;
    mentioned: string;
  };
  my_post: {
    author: string;
    permlink: string;
    title: string;
  };
  my_comment: {
    author: string;
    permlink: string;
    parentAuthor: string;
  };
  vote_like: {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
  };
  vote_downvote: {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
  };
  my_vote: {
    voter: string;
    author: string;
    permlink: string;
    title: string | null;
  };
  reblog: {
    account: string;
    author: string;
    permlink: string;
    title: string | null;
  };
  follow: {
    following: string;
    action: 'follow' | 'unfollow';
  };
  bell_post: {
    author: string;
    permlink: string;
    title: string;
  };
  bell_reblog: {
    account: string;
    author: string;
    permlink: string;
    title: string | null;
  };
  bell_follow: {
    follower: string;
    following: string;
  };
  bell_object_post: {
    author: string;
    permlink: string;
    title: string;
    wobjectPermlink: string;
    wobjectName: string;
  };
  bell_thread: {
    author: string;
    permlink: string;
    authorPermlink: string;
  };
  thread_author_follower: {
    author: string;
    permlink: string;
    hashtags: string[];
    mentions: string[];
  };
  transfer_in: {
    from: string;
    to: string;
    amount: string;
    symbol: string;
    memo: string | null;
  };
  transfer_out: {
    from: string;
    to: string;
    amount: string;
    symbol: string;
    memo: string | null;
  };
  transfer_from_savings: {
    from: string;
    to: string;
    amount: string;
    symbol: string;
    memo: string | null;
  };
  power_up: {
    from: string;
    to: string;
    amount: string;
  };
  power_down: {
    account: string;
    amount: string;
  };
  claim_reward: {
    rewardHive: string;
    rewardHbd: string;
    rewardHp: string;
  };
  witness_vote: {
    witness: string;
    approve: boolean;
  };
  fill_order: {
    currentPays: string;
    openPays: string;
    exchanger: string;
    orderId: number;
  };
  withdraw_route: {
    fromAccount: string;
    toAccount: string;
    percent: number;
    autoVest: boolean;
  };
  change_recovery_account: {
    account: string;
    newRecoveryAccount: string;
  };
  change_password: {
    account: string;
  };
  hp_delegation: {
    delegator: string;
    delegatee: string;
    amount: string;
  };
  engine_transfer: {
    from: string;
    to: string;
    amount: string;
    symbol: string;
    memo: string | null;
  };
  engine_stake: {
    from: string;
    to: string;
    amount: string;
    symbol: string;
  };
  engine_unstake: {
    account: string;
    amount: string;
    symbol: string;
  };
  engine_cancel_unstake: {
    account: string;
    amount: string;
    symbol: string;
  };
  engine_delegate: {
    from: string;
    to: string;
    amount: string;
    symbol: string;
  };
  engine_undelegate: {
    from: string;
    to: string;
    amount: string;
    symbol: string;
  };
  object_update: {
    updateId: string;
    updateType: string;
    objectName: string | null;
    authorPermlink: string | null;
  };
  object_update_reject: {
    updateId: string;
    updateType: string;
    objectName: string | null;
    authorPermlink: string | null;
    voter: string;
  };
  object_status_change: {
    objectName: string | null;
    authorPermlink: string;
    oldStatus: string;
    newStatus: string;
    account: string;
  };
  update_vote_cast: {
    updateId: string;
    vote: string;
  };
  object_created: {
    updateId: string;
    updateType: string;
  };
  batch_import_completed: {
    cid: string;
  };
  trx_processed: Record<string, never>;
}

export type NotificationEventOf<T extends NotificationEventType> =
  NotificationEnvelope & {
    readonly type: T;
    readonly payload: NotificationPayloadMap[T];
  };

export type AnyNotificationEvent = {
  [K in NotificationEventType]: NotificationEventOf<K>;
}[NotificationEventType];

/** Stable wire shape between chain-indexer and notifications. */
export type NotificationEvent = AnyNotificationEvent;

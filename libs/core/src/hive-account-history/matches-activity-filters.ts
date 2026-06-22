import { HIVE_OP } from './operation-types';
import { HIVE_OPERATION_INDEX } from './operation-indices';
import type { ActivityFilterKey } from './activity-filter-keys';
import { parseCustomJsonOp } from './parse-custom-json';
import { getWalletOperationIndices } from './get-wallet-operation-indices';
import { isWalletOperation } from './is-wallet-operation';

export type ActivityHistoryItem = {
  type: string;
  payload: Record<string, unknown>;
};

const SAVINGS_OP_TYPES = new Set<string>([
  HIVE_OP.TRANSFER_TO_SAVINGS,
  HIVE_OP.TRANSFER_FROM_SAVINGS,
  HIVE_OP.CANCEL_TRANSFER_FROM_SAVINGS,
  HIVE_OP.FILL_TRANSFER_FROM_SAVINGS,
  HIVE_OP.INTEREST,
]);

const FILTER_OPERATION_INDICES: Record<ActivityFilterKey, readonly number[]> = {
  upvoted: [HIVE_OPERATION_INDEX.vote],
  downvoted: [HIVE_OPERATION_INDEX.vote],
  unvoted: [HIVE_OPERATION_INDEX.vote],
  followed: [HIVE_OPERATION_INDEX.custom_json],
  unfollowed: [HIVE_OPERATION_INDEX.custom_json],
  replied: [HIVE_OPERATION_INDEX.comment],
  reblogged: [HIVE_OPERATION_INDEX.custom_json],
  powered_up: [
    HIVE_OPERATION_INDEX.transfer_to_vesting,
    HIVE_OPERATION_INDEX.transfer_to_vesting_completed,
  ],
  received: [HIVE_OPERATION_INDEX.transfer],
  transfer: [HIVE_OPERATION_INDEX.transfer],
  savings: [
    HIVE_OPERATION_INDEX.transfer_to_savings,
    HIVE_OPERATION_INDEX.transfer_from_savings,
    HIVE_OPERATION_INDEX.cancel_transfer_from_savings,
    HIVE_OPERATION_INDEX.fill_transfer_from_savings,
    HIVE_OPERATION_INDEX.interest,
  ],
  author_reward: [HIVE_OPERATION_INDEX.author_reward],
  curation_reward: [HIVE_OPERATION_INDEX.curation_reward],
  claim_rewards: [HIVE_OPERATION_INDEX.claim_reward_balance],
  wallet: getWalletOperationIndices(),
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function profileLower(profileAccount: string): string {
  return profileAccount.trim().toLowerCase();
}

function matchesVoteFilter(
  filter: 'upvoted' | 'downvoted' | 'unvoted',
  payload: Record<string, unknown>,
): boolean {
  const weight = asNumber(payload['weight']);
  if (filter === 'upvoted') {
    return weight > 0;
  }
  if (filter === 'downvoted') {
    return weight < 0;
  }
  return weight === 0;
}

function matchesCustomJsonFilter(
  filter: 'followed' | 'unfollowed' | 'reblogged',
  payload: Record<string, unknown>,
): boolean {
  const id = asString(payload['id']);
  const json = asString(payload['json']);
  const parsed = parseCustomJsonOp(id, json);
  if (filter === 'reblogged') {
    return parsed.kind === 'reblog';
  }
  if (parsed.kind !== 'follow') {
    return false;
  }
  if (filter === 'followed') {
    return parsed.what === 'blog';
  }
  return parsed.what === 'unfollow' || parsed.what === 'ignore';
}

function matchesTransferFilter(
  filter: 'received' | 'transfer',
  payload: Record<string, unknown>,
  profileAccount: string,
): boolean {
  const profile = profileLower(profileAccount);
  const to = asString(payload['to']).toLowerCase();
  const from = asString(payload['from']).toLowerCase();
  if (filter === 'received') {
    return to === profile;
  }
  return from === profile && to !== profile;
}

export function getOperationIndicesForActivityFilters(
  filters: readonly ActivityFilterKey[],
): number[] {
  const indices = new Set<number>();
  for (const filter of filters) {
    for (const index of FILTER_OPERATION_INDICES[filter]) {
      indices.add(index);
    }
  }
  return [...indices];
}

export function matchesActivityFilter(
  item: ActivityHistoryItem,
  filter: ActivityFilterKey,
  profileAccount: string,
): boolean {
  switch (filter) {
    case 'upvoted':
    case 'downvoted':
    case 'unvoted':
      return (
        item.type === HIVE_OP.VOTE && matchesVoteFilter(filter, item.payload)
      );
    case 'followed':
    case 'unfollowed':
    case 'reblogged':
      return (
        item.type === HIVE_OP.CUSTOM_JSON &&
        matchesCustomJsonFilter(filter, item.payload)
      );
    case 'replied':
      return (
        item.type === HIVE_OP.COMMENT &&
        asString(item.payload['parent_author']).length > 0
      );
    case 'powered_up':
      return (
        item.type === HIVE_OP.TRANSFER_TO_VESTING ||
        item.type === HIVE_OP.TRANSFER_TO_VESTING_COMPLETED
      );
    case 'received':
    case 'transfer':
      return (
        item.type === HIVE_OP.TRANSFER &&
        matchesTransferFilter(filter, item.payload, profileAccount)
      );
    case 'savings':
      return SAVINGS_OP_TYPES.has(item.type);
    case 'author_reward':
      return item.type === HIVE_OP.AUTHOR_REWARD;
    case 'curation_reward':
      return item.type === HIVE_OP.CURATION_REWARD;
    case 'claim_rewards':
      return item.type === HIVE_OP.CLAIM_REWARD_BALANCE;
    case 'wallet':
      return isWalletOperation(item.type);
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function matchesActivityFilters(
  item: ActivityHistoryItem,
  filters: readonly ActivityFilterKey[],
  profileAccount: string,
): boolean {
  if (filters.length === 0) {
    return true;
  }
  return filters.some((filter) =>
    matchesActivityFilter(item, filter, profileAccount),
  );
}

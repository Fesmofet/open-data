import type { HiveOperation } from '@opden-data-layer/hive-broadcast';
import {
  wireCommentOptionsPayload,
} from '@opden-data-layer/hive-broadcast';

import type { KeychainWireOperation } from '../providers/keychain-provider';

function assertNeverForHiveOp(x: never): never {
  throw new Error(`Unsupported Hive operation: ${JSON.stringify(x)}`);
}

export function toHiveWireOperation(op: HiveOperation): KeychainWireOperation {
  switch (op.type) {
    case 'vote':
      return [
        'vote',
        {
          voter: op.voter,
          author: op.author,
          permlink: op.permlink,
          weight: op.weight,
        },
      ];
    case 'comment':
      return [
        'comment',
        {
          parent_author: op.parent_author,
          parent_permlink: op.parent_permlink,
          author: op.author,
          permlink: op.permlink,
          title: op.title,
          body: op.body,
          json_metadata: op.json_metadata,
        },
      ];
    case 'comment_options':
      return ['comment_options', wireCommentOptionsPayload(op)];
    case 'custom_json':
      return [
        'custom_json',
        {
          required_auths: [...op.required_auths],
          required_posting_auths: [...op.required_posting_auths],
          id: op.id,
          json: op.json,
        },
      ];
    case 'transfer':
      return [
        'transfer',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
          memo: op.memo,
        },
      ];
    case 'transfer_to_vesting':
      return [
        'transfer_to_vesting',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
        },
      ];
    case 'withdraw_vesting':
      return [
        'withdraw_vesting',
        {
          account: op.account,
          vesting_shares: op.vesting_shares,
        },
      ];
    case 'delegate_vesting_shares':
      return [
        'delegate_vesting_shares',
        {
          delegator: op.delegator,
          delegatee: op.delegatee,
          vesting_shares: op.vesting_shares,
        },
      ];
    case 'transfer_to_savings':
      return [
        'transfer_to_savings',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
          memo: op.memo,
        },
      ];
    case 'transfer_from_savings':
      return [
        'transfer_from_savings',
        {
          from: op.from,
          to: op.to,
          amount: op.amount,
          memo: op.memo,
        },
      ];
    case 'cancel_transfer_from_savings':
      return [
        'cancel_transfer_from_savings',
        {
          from: op.from,
          request_id: op.request_id,
        },
      ];
    case 'claim_reward_balance':
      return [
        'claim_reward_balance',
        {
          account: op.account,
          reward_hive: op.reward_hive,
          reward_hbd: op.reward_hbd,
          reward_vests: op.reward_vests,
        },
      ];
    case 'collateralized_convert':
      return [
        'collateralized_convert',
        {
          owner: op.owner,
          requestid: op.requestid,
          amount: op.amount,
        },
      ];
  }
  return assertNeverForHiveOp(op);
}

export function toHiveWireOperations(
  operations: readonly HiveOperation[],
): KeychainWireOperation[] {
  return operations.map(toHiveWireOperation);
}

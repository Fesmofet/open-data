import type { CommentOptionsOp, HiveOperation } from './hive-operations';
import { buildAccountUpdateWirePayload } from './hive-account-authority-operations';

export type HiveWireOperation = [string, Record<string, unknown>];

/**
 * Maps `comment_options` domain op to Hive Keychain / RPC payload object.
 */
export function wireCommentOptionsPayload(op: CommentOptionsOp): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    author: op.author,
    permlink: op.permlink,
    max_accepted_payout: op.max_accepted_payout,
    allow_votes: op.allow_votes,
    allow_curation_rewards: op.allow_curation_rewards,
    extensions: [...op.extensions],
  };
  if (op.percent_hbd !== undefined) {
    payload['percent_hbd'] = op.percent_hbd;
  }
  return payload;
}

function assertNeverForHiveOp(x: never): never {
  throw new Error(`Unsupported Hive operation: ${JSON.stringify(x)}`);
}

/** Convert normalized HiveOperation to condenser wire tuple. */
export function toHiveWireOperation(op: HiveOperation): HiveWireOperation {
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
    case 'account_update':
      return [
        'account_update',
        buildAccountUpdateWirePayload({
          account: op.account,
          memoKey: op.memo_key,
          jsonMetadata: op.json_metadata,
          posting: op.posting,
          active: op.active,
        }),
      ];
  }
  return assertNeverForHiveOp(op);
}

export function toHiveWireOperations(
  operations: readonly HiveOperation[],
): HiveWireOperation[] {
  return operations.map(toHiveWireOperation);
}

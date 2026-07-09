import type { HiveTransaction } from '@opden-data-layer/clients';

/**
 * Maps Hive operation types to the account name that should receive a
 * `last_activity` touch (legacy `userFieldMappings` in chain-indexer-legacy).
 */
export function accountNameFromHiveOperation(
  operationType: string,
  payload: Record<string, unknown>,
): string | null {
  const str = (key: string): string | null => {
    const v = payload[key];
    return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
  };

  switch (operationType) {
    case 'update_proposal_votes':
      return str('voter');
    case 'vote':
    case 'vote2':
      return str('voter');
    case 'delete_comment':
    case 'comment':
      return str('author');
    case 'transfer':
    case 'recurrent_transfer':
    case 'transfer_to_vesting':
    case 'escrow_transfer':
    case 'escrow_dispute':
    case 'escrow_release':
    case 'escrow_approve':
    case 'transfer_to_savings':
    case 'transfer_from_savings':
    case 'cancel_transfer_from_savings':
      return str('from');
    case 'custom':
    case 'custom_json': {
      const auths = payload.required_auths;
      if (Array.isArray(auths) && typeof auths[0] === 'string' && auths[0].trim()) {
        return auths[0].trim();
      }
      const postingAuths = payload.required_posting_auths;
      if (
        Array.isArray(postingAuths) &&
        typeof postingAuths[0] === 'string' &&
        postingAuths[0].trim()
      ) {
        return postingAuths[0].trim();
      }
      return null;
    }
    case 'withdraw_vesting':
    case 'claim_reward_balance':
    case 'claim_reward_balance2':
    case 'account_update':
    case 'account_witness_vote':
    case 'account_witness_proxy':
    case 'decline_voting_rights':
      return str('account');
    case 'account_create':
    case 'claim_account':
    case 'create_claimed_account':
    case 'account_create_with_delegation':
    case 'create_proposal':
    case 'remove_proposal':
    case 'update_proposal':
      return str('creator');
    case 'feed_publish':
      return str('publisher');
    case 'delegate_vesting_shares':
      return str('delegator');
    case 'set_withdraw_vesting_route':
      return str('from_account');
    case 'limit_order_cancel':
    case 'limit_order_create':
    case 'convert':
    case 'witness_set_properties':
    case 'witness_update':
    case 'limit_order_create2':
    case 'fill_convert_request':
      return str('owner');
    default:
      return null;
  }
}

export function collectActiveAccountNamesFromBlock(
  transactions: ReadonlyArray<Pick<HiveTransaction, 'operations'>>,
): string[] {
  const names = new Set<string>();
  for (const transaction of transactions) {
    const operations = transaction.operations;
    if (!operations?.length) continue;
    for (const operation of operations) {
      const type = operation[0];
      const payload = operation[1];
      const name = accountNameFromHiveOperation(
        type,
        payload as Record<string, unknown>,
      );
      if (name) {
        names.add(name);
      }
    }
  }
  return [...names];
}

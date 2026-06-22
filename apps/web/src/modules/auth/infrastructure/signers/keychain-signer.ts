'use client';

import type { IHiveSigner } from '../../application/ports/hive-signer.port';
import {
  wireCommentOptionsPayload,
  type HiveOperation,
  type HiveOperationPayload,
} from '@opden-data-layer/hive-broadcast';
import type { BroadcastTransactionResult } from '../../domain/types';
import type { KeychainWireOperation, HiveKeychainWindow } from '../providers/keychain-provider';
import { resolveKeychainBroadcastKey } from './hive-operation-signing';

function resolveSigningAccount(operations: readonly HiveOperation[]): string {
  if (operations.length === 0) {
    throw new Error('No operations to broadcast');
  }
  const accounts = new Set<string>();
  for (const op of operations) {
    switch (op.type) {
      case 'vote':
        accounts.add(op.voter);
        break;
      case 'comment':
      case 'comment_options':
        accounts.add(op.author);
        break;
      case 'transfer':
      case 'transfer_to_vesting':
      case 'transfer_to_savings':
      case 'transfer_from_savings':
        accounts.add(op.from);
        break;
      case 'withdraw_vesting':
      case 'delegate_vesting_shares':
      case 'cancel_transfer_from_savings':
        accounts.add(
          op.type === 'withdraw_vesting'
            ? op.account
            : op.type === 'delegate_vesting_shares'
              ? op.delegator
              : op.from,
        );
        break;
      case 'custom_json': {
        const posting = op.required_posting_auths[0];
        const active = op.required_auths[0];
        const primary = posting ?? active;
        if (primary == null || primary === '') {
          throw new Error('custom_json must set required_posting_auths or required_auths');
        }
        accounts.add(primary);
        break;
      }
    }
  }
  if (accounts.size !== 1) {
    throw new Error('All operations must use the same signing account');
  }
  const [account] = accounts;
  if (account == null || account === '') {
    throw new Error('Signing account could not be resolved');
  }
  return account;
}

function assertNeverForHiveOp(x: never): never {
  throw new Error(`Unsupported Hive operation: ${JSON.stringify(x)}`);
}

function toWireOperation(op: HiveOperation): KeychainWireOperation {
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
  }
  return assertNeverForHiveOp(op);
}

function extractTransactionIdFromBroadcastResult(result: unknown): string | null {
  if (typeof result === 'string' && result.trim().length > 0) {
    return result.trim();
  }
  if (result && typeof result === 'object') {
    const o = result as Record<string, unknown>;
    const id = o.id ?? o.transaction_id ?? o.tx_id;
    if (typeof id === 'string' && id.trim().length > 0) {
      return id.trim();
    }
  }
  return null;
}

export function createKeychainSigner(): IHiveSigner {
  return {
    async sign(payload: HiveOperationPayload): Promise<BroadcastTransactionResult> {
      const win = window as HiveKeychainWindow;
      const kc = win.hive_keychain;
      if (!kc?.requestBroadcast) {
        throw new Error('Hive Keychain extension not found or requestBroadcast unavailable');
      }
      const account = resolveSigningAccount(payload.operations);
      const wireOps = payload.operations.map(toWireOperation);
      const key = resolveKeychainBroadcastKey(payload.operations);
      return new Promise((resolve, reject) => {
        kc.requestBroadcast(account, wireOps, key, (response) => {
          if (!response.success) {
            reject(new Error(response.error ?? 'Broadcast failed'));
            return;
          }
          const txId = extractTransactionIdFromBroadcastResult(response.result);
          if (!txId) {
            reject(new Error('Broadcast succeeded but transaction id missing'));
            return;
          }
          resolve({ transactionId: txId });
        });
      });
    },
  };
}

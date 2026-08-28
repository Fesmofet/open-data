'use client';

import type { IHiveSigner } from '../../application/ports/hive-signer.port';
import type { HiveOperationPayload } from '@opden-data-layer/hive-broadcast';
import type { BroadcastTransactionResult } from '../../domain/types';
import type { HiveKeychainWindow } from '../providers/keychain-provider';
import { extractTransactionIdFromBroadcastResult } from './extract-transaction-id';
import { resolveKeychainBroadcastKey } from './hive-operation-signing';
import { toHiveWireOperations } from './hive-operation-wire';

function resolveSigningAccount(operations: HiveOperationPayload['operations']): string {
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
      case 'claim_reward_balance':
        accounts.add(
          op.type === 'withdraw_vesting' || op.type === 'claim_reward_balance'
            ? op.account
            : op.type === 'delegate_vesting_shares'
              ? op.delegator
              : op.from,
        );
        break;
      case 'collateralized_convert':
        accounts.add(op.owner);
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

export function createKeychainSigner(): IHiveSigner {
  return {
    async sign(payload: HiveOperationPayload): Promise<BroadcastTransactionResult> {
      const win = window as HiveKeychainWindow;
      const kc = win.hive_keychain;
      if (!kc?.requestBroadcast) {
        throw new Error('Hive Keychain extension not found or requestBroadcast unavailable');
      }
      const account = resolveSigningAccount(payload.operations);
      const wireOps = toHiveWireOperations(payload.operations);
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

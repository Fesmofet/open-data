'use client';

import type { IHiveSigner } from '../../application/ports/hive-signer.port';
import type { HiveOperationPayload } from '@opden-data-layer/hive-broadcast';
import type { BroadcastTransactionResult } from '../../domain/types';
import { getHasConfigClient } from '@/config/has-config.client';

import {
  dispatchHasSignError,
  dispatchHasSignSuccess,
  dispatchHasSignWait,
  resolveHasSignWaitKind,
} from '../has-sign-wait-events';
import {
  broadcastWithHas,
  requireHasAuthSession,
} from '../providers/has';
import {
  resolveKeychainBroadcastKey,
  type HiveKeychainBroadcastKey,
} from './hive-operation-signing';
import { toHiveWireOperations } from './hive-operation-wire';
import { extractTransactionIdFromHasResult } from './extract-transaction-id';

function toHasKeyType(key: HiveKeychainBroadcastKey): 'posting' | 'active' {
  return key === 'Active' ? 'active' : 'posting';
}

export function createHiveAuthSigner(): IHiveSigner {
  return {
    async sign(payload: HiveOperationPayload): Promise<BroadcastTransactionResult> {
      const session = requireHasAuthSession();
      const kind = resolveHasSignWaitKind(payload.operations);

      const wireOps = toHiveWireOperations(payload.operations);
      const keyType = toHasKeyType(resolveKeychainBroadcastKey(payload.operations));

      try {
        const result = await broadcastWithHas({
          session,
          keyType,
          ops: wireOps,
          config: getHasConfigClient(),
          onSignWait: () => {
            dispatchHasSignWait(kind);
          },
        });

        const txId = extractTransactionIdFromHasResult(result);
        if (!txId) {
          throw new Error('Transaction was broadcast but the id was not returned.');
        }
        dispatchHasSignSuccess();
        return { transactionId: txId };
      } catch (err) {
        dispatchHasSignError(err instanceof Error ? err.message : 'Broadcast failed');
        throw err;
      }
    },
  };
}

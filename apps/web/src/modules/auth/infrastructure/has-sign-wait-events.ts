import type { HiveOperation } from '@opden-data-layer/hive-broadcast';

export type HasSignWaitKind = 'vote' | 'comment' | 'transaction' | 'generic';

export const HAS_SIGN_WAIT_EVENT = 'odl:has-sign-wait';
export const HAS_SIGN_SUCCESS_EVENT = 'odl:has-sign-success';
export const HAS_SIGN_ERROR_EVENT = 'odl:has-sign-error';

export type HasSignWaitEventDetail = {
  kind: HasSignWaitKind;
};

export type HasSignErrorEventDetail = {
  message: string;
};

const TRANSACTION_OPERATION_TYPES = new Set<HiveOperation['type']>([
  'custom_json',
  'transfer',
  'transfer_to_vesting',
  'withdraw_vesting',
  'delegate_vesting_shares',
  'transfer_to_savings',
  'transfer_from_savings',
  'cancel_transfer_from_savings',
  'claim_reward_balance',
]);

function operationKind(op: HiveOperation): HasSignWaitKind {
  if (op.type === 'vote') {
    return 'vote';
  }
  if (op.type === 'comment' || op.type === 'comment_options') {
    return 'comment';
  }
  if (TRANSACTION_OPERATION_TYPES.has(op.type)) {
    return 'transaction';
  }
  return 'generic';
}

export function resolveHasSignWaitKind(
  operations: readonly HiveOperation[],
): HasSignWaitKind {
  if (operations.length === 0) {
    return 'generic';
  }
  const kinds = new Set(operations.map(operationKind));
  if (kinds.size === 1) {
    return kinds.values().next().value ?? 'generic';
  }
  return 'generic';
}

export function dispatchHasSignWait(kind: HasSignWaitKind): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<HasSignWaitEventDetail>(HAS_SIGN_WAIT_EVENT, {
      detail: { kind },
    }),
  );
}

export function dispatchHasSignSuccess(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(HAS_SIGN_SUCCESS_EVENT));
}

export function dispatchHasSignError(message: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<HasSignErrorEventDetail>(HAS_SIGN_ERROR_EVENT, {
      detail: { message },
    }),
  );
}

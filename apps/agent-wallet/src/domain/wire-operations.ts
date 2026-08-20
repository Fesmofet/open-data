import type { CustomJsonOp, HiveOperation } from '@opden-data-layer/hive-broadcast';
import { toHiveWireOperation } from '@opden-data-layer/hive-broadcast';

export function isCustomJsonOp(value: unknown): value is CustomJsonOp {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const op = value as Record<string, unknown>;
  return op['type'] === 'custom_json' && typeof op['json'] === 'string';
}

function isHiveOperationLike(value: unknown): value is HiveOperation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return typeof (value as Record<string, unknown>)['type'] === 'string';
}

export function toHiveWireOperations(ops: unknown[]): unknown[] {
  return ops.map((op) => {
    if (Array.isArray(op)) {
      return op;
    }
    if (isHiveOperationLike(op)) {
      return toHiveWireOperation(op);
    }
    throw new Error('Unsupported operation shape for broadcast');
  });
}

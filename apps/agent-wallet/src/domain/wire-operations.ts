import type { CustomJsonOp } from '@opden-data-layer/hive-broadcast';

type WireCustomJson = [
  'custom_json',
  {
    required_auths: string[];
    required_posting_auths: string[];
    id: string;
    json: string;
  },
];

export function isCustomJsonOp(value: unknown): value is CustomJsonOp {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const op = value as Record<string, unknown>;
  return op['type'] === 'custom_json' && typeof op['json'] === 'string';
}

export function toHiveWireOperations(ops: unknown[]): unknown[] {
  return ops.map((op) => {
    if (Array.isArray(op)) {
      return op;
    }
    if (isCustomJsonOp(op)) {
      return [
        'custom_json',
        {
          required_auths: [...op.required_auths],
          required_posting_auths: [...op.required_posting_auths],
          id: op.id,
          json: op.json,
        },
      ] satisfies WireCustomJson;
    }
    throw new Error('Unsupported operation shape for HAS broadcast');
  });
}

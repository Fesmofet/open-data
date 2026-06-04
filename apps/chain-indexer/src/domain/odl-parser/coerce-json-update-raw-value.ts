import type { UpdateDefinition } from '@opden-data-layer/core';
import { z } from 'zod';

function unwrapRootStringArraySchema(
  schema: z.ZodType,
): z.ZodArray<z.ZodString> | null {
  let inner: z.ZodType = schema;
  if (inner instanceof z.ZodOptional) {
    inner = inner.unwrap() as z.ZodType;
  }
  if (inner instanceof z.ZodDefault) {
    inner = inner.removeDefault() as z.ZodType;
  }
  if (inner instanceof z.ZodArray && inner.element instanceof z.ZodString) {
    return inner as z.ZodArray<z.ZodString>;
  }
  return null;
}

/**
 * IPFS / legacy payloads may send `value_json` as a JSON string or newline-separated text.
 */
export function coerceJsonUpdateRawValue(
  definition: UpdateDefinition,
  raw: unknown,
): unknown {
  if (typeof raw !== 'string') {
    return raw;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return raw;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    if (unwrapRootStringArraySchema(definition.schema)) {
      return trimmed
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }
    return raw;
  }
}

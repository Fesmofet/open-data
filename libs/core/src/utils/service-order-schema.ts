export const SERVICE_ORDER_SCHEMA_LIMITS = {
  maxProperties: 30,
  maxKeyLength: 64,
  maxDepth: 1,
} as const;

export const DANGEROUS_SERVICE_ORDER_SCHEMA_KEYS = [
  '__proto__',
  'prototype',
  'constructor',
] as const;

export const SERVICE_ORDER_SCHEMA_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
] as const;

export type ServiceOrderSchemaType = (typeof SERVICE_ORDER_SCHEMA_TYPES)[number];

export const SERVICE_ORDER_SCHEMA_KEYWORDS = new Set([
  '$ref',
  'type',
  'title',
  'description',
  'default',
  'examples',
  'enum',
  'const',
  'format',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'items',
  'properties',
  'required',
  'additionalProperties',
  'oneOf',
  'anyOf',
  'allOf',
  'not',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDangerousKey(key: string): boolean {
  return (DANGEROUS_SERVICE_ORDER_SCHEMA_KEYS as readonly string[]).includes(key.trim());
}

function isAllowedType(value: unknown): value is ServiceOrderSchemaType {
  return (
    typeof value === 'string' &&
    (SERVICE_ORDER_SCHEMA_TYPES as readonly string[]).includes(value)
  );
}

function filterKeywords(
  source: Record<string, unknown>,
  depth: number,
): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!SERVICE_ORDER_SCHEMA_KEYWORDS.has(key)) {
      continue;
    }
    if (key === 'properties' && depth <= SERVICE_ORDER_SCHEMA_LIMITS.maxDepth && isRecord(value)) {
      const properties: Record<string, unknown> = {};
      let count = 0;
      for (const [propKey, propSchema] of Object.entries(value)) {
        const trimmed = propKey.trim();
        if (!trimmed || isDangerousKey(trimmed)) {
          continue;
        }
        if (trimmed.length > SERVICE_ORDER_SCHEMA_LIMITS.maxKeyLength) {
          continue;
        }
        if (!isRecord(propSchema)) {
          continue;
        }
        const sanitized = sanitizeSchemaFragment(propSchema, depth + 1);
        if (sanitized) {
          properties[trimmed] = sanitized;
          count += 1;
        }
        if (count >= SERVICE_ORDER_SCHEMA_LIMITS.maxProperties) {
          break;
        }
      }
      if (Object.keys(properties).length > 0) {
        out['properties'] = properties;
      }
      continue;
    }
    if (key === 'items' && depth <= SERVICE_ORDER_SCHEMA_LIMITS.maxDepth) {
      if (isRecord(value)) {
        const sanitized = sanitizeSchemaFragment(value, depth + 1);
        if (sanitized) {
          out['items'] = sanitized;
        }
      }
      continue;
    }
    if (key === 'required' && Array.isArray(value)) {
      const required = value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0 && !isDangerousKey(entry));
      if (required.length > 0) {
        out['required'] = [...new Set(required)];
      }
      continue;
    }
    if (key === 'type') {
      if (isAllowedType(value)) {
        out['type'] = value;
      }
      continue;
    }
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function sanitizeSchemaFragment(
  schema: Record<string, unknown>,
  depth: number,
): Record<string, unknown> | null {
  return filterKeywords(schema, depth);
}

/**
 * Sanitize a root service-order JSON Schema object for storage on a contract.
 */
export function sanitizeServiceOrderSchema(
  schema: unknown,
): Record<string, unknown> | null {
  if (!isRecord(schema)) {
    return null;
  }
  const filtered = filterKeywords(schema, 0);
  if (!filtered) {
    return null;
  }
  const properties = filtered['properties'];
  if (!isRecord(properties) || Object.keys(properties).length === 0) {
    return null;
  }
  return {
    ...filtered,
    type: 'object' as const,
    properties,
  };
}

export function extractServiceOrderSchemaFromOfferTerms(
  terms: unknown,
): unknown {
  if (!isRecord(terms)) {
    return undefined;
  }
  if ('serviceOrderSchema' in terms) {
    return terms['serviceOrderSchema'];
  }
  if ('service_order_schema' in terms) {
    return terms['service_order_schema'];
  }
  return undefined;
}

export function serviceOrderSchemaFromOfferTerms(
  terms: unknown,
): Record<string, unknown> | null {
  const raw = extractServiceOrderSchemaFromOfferTerms(terms);
  if (raw === undefined) {
    return null;
  }
  return sanitizeServiceOrderSchema(raw);
}

function emptyValueForFragment(schema: Record<string, unknown>, depth: number): unknown {
  if ('default' in schema) {
    return schema['default'];
  }
  const type = schema['type'];
  if (type === 'object' && depth <= SERVICE_ORDER_SCHEMA_LIMITS.maxDepth) {
    const props = schema['properties'];
    if (isRecord(props)) {
      const record: Record<string, unknown> = {};
      for (const [key, sub] of Object.entries(props)) {
        if (!isRecord(sub)) {
          record[key] = '';
          continue;
        }
        record[key] = emptyValueForFragment(sub, depth + 1);
      }
      return record;
    }
    return {};
  }
  if (type === 'array' && depth <= SERVICE_ORDER_SCHEMA_LIMITS.maxDepth) {
    return [];
  }
  if (type === 'boolean') {
    return false;
  }
  if (type === 'null') {
    return null;
  }
  if (type === 'number' || type === 'integer') {
    return 0;
  }
  return '';
}

/**
 * Build an empty details object from a sanitized service-order schema (recommendation prefill).
 */
export function emptyValueFromServiceOrderSchema(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized = sanitizeServiceOrderSchema(schema);
  if (!sanitized) {
    return {};
  }
  const value = emptyValueForFragment(sanitized, 0);
  return isRecord(value) ? value : {};
}

export type ServiceOrderSchemaValidationIssue = {
  code:
    | 'invalid_root'
    | 'empty_key'
    | 'duplicate_key'
    | 'dangerous_key'
    | 'key_too_long'
    | 'max_properties'
    | 'invalid_type'
    | 'unknown_keyword'
    | 'invalid_advanced_json';
  key?: string;
};

export function validateServiceOrderSchema(
  schema: unknown,
): ServiceOrderSchemaValidationIssue[] {
  const issues: ServiceOrderSchemaValidationIssue[] = [];
  if (!isRecord(schema)) {
    issues.push({ code: 'invalid_root' });
    return issues;
  }
  for (const key of Object.keys(schema)) {
    if (!SERVICE_ORDER_SCHEMA_KEYWORDS.has(key)) {
      issues.push({ code: 'unknown_keyword', key });
    }
  }
  const properties = schema['properties'];
  if (!isRecord(properties)) {
    issues.push({ code: 'invalid_root' });
    return issues;
  }
  const seen = new Set<string>();
  let nonEmpty = 0;
  for (const [propKey, propSchema] of Object.entries(properties)) {
    const trimmed = propKey.trim();
    if (trimmed.length === 0) {
      issues.push({ code: 'empty_key', key: propKey });
      continue;
    }
    if (isDangerousKey(trimmed)) {
      issues.push({ code: 'dangerous_key', key: trimmed });
    }
    if (trimmed.length > SERVICE_ORDER_SCHEMA_LIMITS.maxKeyLength) {
      issues.push({ code: 'key_too_long', key: trimmed });
    }
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) {
      issues.push({ code: 'duplicate_key', key: trimmed });
    } else {
      seen.add(normalized);
    }
    nonEmpty += 1;
    if (!isRecord(propSchema)) {
      continue;
    }
    if ('type' in propSchema && !isAllowedType(propSchema['type'])) {
      issues.push({ code: 'invalid_type', key: trimmed });
    }
    for (const subKey of Object.keys(propSchema)) {
      if (!SERVICE_ORDER_SCHEMA_KEYWORDS.has(subKey)) {
        issues.push({ code: 'unknown_keyword', key: `${trimmed}.${subKey}` });
      }
    }
  }
  if (nonEmpty > SERVICE_ORDER_SCHEMA_LIMITS.maxProperties) {
    issues.push({ code: 'max_properties' });
  }
  return issues;
}

export function isServiceOrderSchemaValid(schema: unknown): boolean {
  return validateServiceOrderSchema(schema).length === 0;
}

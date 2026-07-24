import {
  emptyValueFromServiceOrderSchema,
  isServiceOrderSchemaValid,
  sanitizeServiceOrderSchema,
  SERVICE_ORDER_SCHEMA_KEYWORDS,
  SERVICE_ORDER_SCHEMA_LIMITS,
  SERVICE_ORDER_SCHEMA_TYPES,
  validateServiceOrderSchema,
  type ServiceOrderSchemaType,
  type ServiceOrderSchemaValidationIssue,
} from '@opden-data-layer/core/utils/service-order-schema';

export {
  sanitizeServiceOrderSchema,
  SERVICE_ORDER_SCHEMA_LIMITS,
  SERVICE_ORDER_SCHEMA_TYPES,
  validateServiceOrderSchema,
  emptyValueFromServiceOrderSchema as emptyValueFromSchema,
  isServiceOrderSchemaValid,
  type ServiceOrderSchemaType,
  type ServiceOrderSchemaValidationIssue,
};

export type SchemaPropertyRow = {
  id: string;
  key: string;
  type: ServiceOrderSchemaType;
  title: string;
  description: string;
  required: boolean;
  defaultValue: string;
  enumText: string;
  format: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  minimum: string;
  maximum: string;
  advancedRaw: string;
  children: SchemaPropertyRow[];
  itemSchema: SchemaPropertyRow | null;
};

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptySchemaPropertyRow(): SchemaPropertyRow {
  return {
    id: newId(),
    key: '',
    type: 'string',
    title: '',
    description: '',
    required: false,
    defaultValue: '',
    enumText: '',
    format: '',
    minLength: '',
    maxLength: '',
    pattern: '',
    minimum: '',
    maximum: '',
    advancedRaw: '',
    children: [],
    itemSchema: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAdvancedRaw(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isRecord(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function pickAdvancedOnly(fragment: Record<string, unknown>): Record<string, unknown> {
  const structured = new Set([
    'type',
    'title',
    'description',
    'default',
    'enum',
    'format',
    'minLength',
    'maxLength',
    'pattern',
    'minimum',
    'maximum',
    'properties',
    'required',
    'items',
  ]);
  const advanced: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fragment)) {
    if (!structured.has(key) && SERVICE_ORDER_SCHEMA_KEYWORDS.has(key)) {
      advanced[key] = value;
    }
  }
  return advanced;
}

function fragmentFromRow(row: SchemaPropertyRow, depth: number): Record<string, unknown> {
  const fragment: Record<string, unknown> = { type: row.type };
  const title = row.title.trim();
  const description = row.description.trim();
  if (title.length > 0) {
    fragment.title = title;
  }
  if (description.length > 0) {
    fragment.description = description;
  }
  if (row.defaultValue.trim().length > 0) {
    try {
      fragment.default = JSON.parse(row.defaultValue) as unknown;
    } catch {
      fragment.default = row.defaultValue;
    }
  }
  if (row.enumText.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(row.enumText);
      if (Array.isArray(parsed)) {
        fragment.enum = parsed;
      }
    } catch {
      // ignore invalid enum JSON
    }
  }
  const format = row.format.trim();
  if (format.length > 0) {
    fragment.format = format;
  }
  const assignNumber = (key: 'minLength' | 'maxLength' | 'minimum' | 'maximum', raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return;
    }
    const n = Number(trimmed);
    if (Number.isFinite(n)) {
      fragment[key] = n;
    }
  };
  assignNumber('minLength', row.minLength);
  assignNumber('maxLength', row.maxLength);
  assignNumber('minimum', row.minimum);
  assignNumber('maximum', row.maximum);
  const pattern = row.pattern.trim();
  if (pattern.length > 0) {
    fragment.pattern = pattern;
  }
  if (row.type === 'object' && depth < SERVICE_ORDER_SCHEMA_LIMITS.maxDepth) {
    const childProps: Record<string, unknown> = {};
    const required: string[] = [];
    for (const child of row.children) {
      const childKey = child.key.trim();
      if (!childKey) {
        continue;
      }
      childProps[childKey] = fragmentFromRow(child, depth + 1);
      if (child.required) {
        required.push(childKey);
      }
    }
    if (Object.keys(childProps).length > 0) {
      fragment.properties = childProps;
      if (required.length > 0) {
        fragment.required = required;
      }
    }
  }
  if (row.type === 'array' && depth < SERVICE_ORDER_SCHEMA_LIMITS.maxDepth && row.itemSchema) {
    fragment.items = fragmentFromRow(row.itemSchema, depth + 1);
  }
  const advanced = parseAdvancedRaw(row.advancedRaw);
  if (advanced) {
    for (const [key, value] of Object.entries(advanced)) {
      if (SERVICE_ORDER_SCHEMA_KEYWORDS.has(key)) {
        fragment[key] = value;
      }
    }
  }
  return fragment;
}

export function buildJsonSchema(rows: SchemaPropertyRow[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) {
      continue;
    }
    properties[key] = fragmentFromRow(row, 0);
    if (row.required) {
      required.push(key);
    }
  }
  const schema: Record<string, unknown> = {
    type: 'object',
    properties,
  };
  if (required.length > 0) {
    schema.required = required;
  }
  const sanitized = sanitizeServiceOrderSchema(schema);
  return sanitized ?? { type: 'object', properties: {} };
}

function rowFromFragment(
  key: string,
  fragment: Record<string, unknown>,
  depth: number,
): SchemaPropertyRow {
  const type =
    typeof fragment.type === 'string' &&
    (SERVICE_ORDER_SCHEMA_TYPES as readonly string[]).includes(fragment.type)
      ? (fragment.type as ServiceOrderSchemaType)
      : 'string';
  const advanced = pickAdvancedOnly(fragment);
  const row: SchemaPropertyRow = {
    id: newId(),
    key,
    type,
    title: typeof fragment.title === 'string' ? fragment.title : '',
    description: typeof fragment.description === 'string' ? fragment.description : '',
    required: false,
    defaultValue:
      fragment.default !== undefined ? JSON.stringify(fragment.default) : '',
    enumText: Array.isArray(fragment.enum) ? JSON.stringify(fragment.enum) : '',
    format: typeof fragment.format === 'string' ? fragment.format : '',
    minLength:
      typeof fragment.minLength === 'number' ? String(fragment.minLength) : '',
    maxLength:
      typeof fragment.maxLength === 'number' ? String(fragment.maxLength) : '',
    pattern: typeof fragment.pattern === 'string' ? fragment.pattern : '',
    minimum: typeof fragment.minimum === 'number' ? String(fragment.minimum) : '',
    maximum: typeof fragment.maximum === 'number' ? String(fragment.maximum) : '',
    advancedRaw:
      Object.keys(advanced).length > 0 ? JSON.stringify(advanced, null, 2) : '',
    children: [],
    itemSchema: null,
  };
  if (type === 'object' && depth < SERVICE_ORDER_SCHEMA_LIMITS.maxDepth) {
    const props = fragment.properties;
    if (isRecord(props)) {
      row.children = Object.entries(props).map(([childKey, childSchema]) =>
        isRecord(childSchema)
          ? rowFromFragment(childKey, childSchema, depth + 1)
          : createEmptySchemaPropertyRow(),
      );
    }
  }
  if (type === 'array' && depth < SERVICE_ORDER_SCHEMA_LIMITS.maxDepth) {
    const items = fragment.items;
    if (isRecord(items)) {
      row.itemSchema = rowFromFragment('', items, depth + 1);
    }
  }
  return row;
}

export function parseJsonSchema(schema: Record<string, unknown>): SchemaPropertyRow[] {
  const sanitized = sanitizeServiceOrderSchema(schema);
  if (!sanitized) {
    return [createEmptySchemaPropertyRow()];
  }
  const properties = sanitized.properties;
  if (!isRecord(properties)) {
    return [createEmptySchemaPropertyRow()];
  }
  const requiredList = Array.isArray(sanitized.required)
    ? sanitized.required.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const requiredSet = new Set(requiredList.map((entry) => entry.trim()));
  return Object.entries(properties).map(([key, fragment]) => {
    const row = isRecord(fragment)
      ? rowFromFragment(key, fragment, 0)
      : createEmptySchemaPropertyRow();
    row.key = key;
    row.required = requiredSet.has(key.trim());
    return row;
  });
}

export function validateSchemaRows(rows: SchemaPropertyRow[]): ServiceOrderSchemaValidationIssue[] {
  const built = buildJsonSchema(rows);
  const issues = validateServiceOrderSchema(built);
  for (const row of rows) {
    if (row.key.trim().length === 0 && rows.length > 1) {
      issues.push({ code: 'empty_key', key: row.id });
    }
    if (row.advancedRaw.trim().length > 0 && parseAdvancedRaw(row.advancedRaw) === null) {
      issues.push({ code: 'invalid_advanced_json', key: row.key || row.id });
    }
  }
  return issues;
}

export function isSchemaRowsValid(rows: SchemaPropertyRow[]): boolean {
  return validateSchemaRows(rows).length === 0;
}

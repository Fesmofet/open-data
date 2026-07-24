export const OBJECT_BUILDER_LIMITS = {
  maxProperties: 30,
  maxKeyLength: 64,
  maxDepth: 1,
} as const;

export const DANGEROUS_OBJECT_BUILDER_KEYS = [
  '__proto__',
  'prototype',
  'constructor',
] as const;

export type ObjectBuilderScalarType = 'string' | 'number' | 'boolean' | 'null';

export type ObjectBuilderType = ObjectBuilderScalarType | 'object' | 'array';

export type ObjectBuilderArrayItem = {
  id: string;
  type: ObjectBuilderScalarType;
  value: string;
  boolValue: boolean;
};

export type ObjectBuilderRow = {
  id: string;
  key: string;
  type: ObjectBuilderType;
  value: string;
  boolValue: boolean;
  children: ObjectBuilderRow[];
  items: ObjectBuilderArrayItem[];
};

export type ObjectBuilderValidationIssue = {
  code:
    | 'empty_key'
    | 'duplicate_key'
    | 'dangerous_key'
    | 'key_too_long'
    | 'max_properties';
  rowId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ob-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyArrayItem(): ObjectBuilderArrayItem {
  return {
    id: newId(),
    type: 'string',
    value: '',
    boolValue: false,
  };
}

export function createEmptyRow(): ObjectBuilderRow {
  return {
    id: newId(),
    key: '',
    type: 'string',
    value: '',
    boolValue: false,
    children: [],
    items: [],
  };
}

function isDangerousKey(key: string): boolean {
  const trimmed = key.trim();
  return (DANGEROUS_OBJECT_BUILDER_KEYS as readonly string[]).includes(trimmed);
}

function scalarValueFromItem(item: ObjectBuilderArrayItem): unknown {
  switch (item.type) {
    case 'string':
      return item.value;
    case 'number': {
      const n = Number(item.value);
      return Number.isFinite(n) ? n : 0;
    }
    case 'boolean':
      return item.boolValue;
    case 'null':
      return null;
    default:
      return item.value;
  }
}

function scalarValueFromRow(row: ObjectBuilderRow): unknown {
  switch (row.type) {
    case 'string':
      return row.value;
    case 'number': {
      const n = Number(row.value);
      return Number.isFinite(n) ? n : 0;
    }
    case 'boolean':
      return row.boolValue;
    case 'null':
      return null;
    default:
      return row.value;
  }
}

function rowsToRecordAtDepth(
  rows: ObjectBuilderRow[],
  depth: number,
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key.length === 0) {
      continue;
    }
    if (row.type === 'object') {
      record[key] = rowsToRecordAtDepth(row.children, depth + 1);
      continue;
    }
    if (row.type === 'array') {
      record[key] = row.items.map((item) => scalarValueFromItem(item));
      continue;
    }
    record[key] = scalarValueFromRow(row);
  }
  return record;
}

export function rowsToRecord(rows: ObjectBuilderRow[]): Record<string, unknown> {
  return rowsToRecordAtDepth(rows, 0);
}

function inferScalarType(value: unknown): ObjectBuilderScalarType {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return 'number';
  }
  return 'string';
}

function valueToRowFields(
  value: unknown,
  depth: number,
): Pick<ObjectBuilderRow, 'type' | 'value' | 'boolValue' | 'children' | 'items'> {
  if (depth < OBJECT_BUILDER_LIMITS.maxDepth && isRecord(value)) {
    return {
      type: 'object',
      value: '',
      boolValue: false,
      children: recordToRowsAtDepth(value, depth + 1),
      items: [],
    };
  }
  if (Array.isArray(value) && depth < OBJECT_BUILDER_LIMITS.maxDepth) {
    const items: ObjectBuilderArrayItem[] = value.map((entry) => {
      const scalarType = inferScalarType(entry);
      if (scalarType === 'boolean') {
        return {
          id: newId(),
          type: 'boolean',
          value: '',
          boolValue: entry === true,
        };
      }
      if (scalarType === 'null') {
        return {
          id: newId(),
          type: 'null',
          value: '',
          boolValue: false,
        };
      }
      if (scalarType === 'number') {
        return {
          id: newId(),
          type: 'number',
          value: String(entry),
          boolValue: false,
        };
      }
      if (typeof entry === 'string') {
        return {
          id: newId(),
          type: 'string',
          value: entry,
          boolValue: false,
        };
      }
      return {
        id: newId(),
        type: 'string',
        value: JSON.stringify(entry),
        boolValue: false,
      };
    });
    return {
      type: 'array',
      value: '',
      boolValue: false,
      children: [],
      items,
    };
  }
  const scalarType = inferScalarType(value);
  if (scalarType === 'boolean') {
    return {
      type: 'boolean',
      value: '',
      boolValue: value === true,
      children: [],
      items: [],
    };
  }
  if (scalarType === 'null') {
    return {
      type: 'null',
      value: '',
      boolValue: false,
      children: [],
      items: [],
    };
  }
  if (scalarType === 'number') {
    return {
      type: 'number',
      value: String(value),
      boolValue: false,
      children: [],
      items: [],
    };
  }
  if (typeof value === 'string') {
    return {
      type: 'string',
      value,
      boolValue: false,
      children: [],
      items: [],
    };
  }
  return {
    type: 'string',
    value: JSON.stringify(value),
    boolValue: false,
    children: [],
    items: [],
  };
}

function recordToRowsAtDepth(
  record: Record<string, unknown>,
  depth: number,
): ObjectBuilderRow[] {
  return Object.entries(record).map(([key, entryValue]) => {
    const fields = valueToRowFields(entryValue, depth);
    return {
      id: newId(),
      key,
      ...fields,
    };
  });
}

export function recordToRows(value: Record<string, unknown>): ObjectBuilderRow[] {
  return recordToRowsAtDepth(value, 0);
}

function validateRowsAtLevel(
  rows: ObjectBuilderRow[],
  depth: number,
  issues: ObjectBuilderValidationIssue[],
): void {
  const nonEmptyRows = rows.filter((row) => row.key.trim().length > 0);
  if (nonEmptyRows.length > OBJECT_BUILDER_LIMITS.maxProperties) {
    issues.push({ code: 'max_properties' });
  }

  const seenKeys = new Set<string>();
  for (const row of rows) {
    const key = row.key.trim();
    if (key.length === 0) {
      if (row.key.length > 0 || rows.length > 1) {
        issues.push({ code: 'empty_key', rowId: row.id });
      }
      continue;
    }
    if (key.length > OBJECT_BUILDER_LIMITS.maxKeyLength) {
      issues.push({ code: 'key_too_long', rowId: row.id });
    }
    if (isDangerousKey(key)) {
      issues.push({ code: 'dangerous_key', rowId: row.id });
    }
    const normalized = key.toLowerCase();
    if (seenKeys.has(normalized)) {
      issues.push({ code: 'duplicate_key', rowId: row.id });
    } else {
      seenKeys.add(normalized);
    }

    if (row.type === 'object' && depth < OBJECT_BUILDER_LIMITS.maxDepth) {
      validateRowsAtLevel(row.children, depth + 1, issues);
    }
  }
}

export function validateRows(rows: ObjectBuilderRow[]): ObjectBuilderValidationIssue[] {
  const issues: ObjectBuilderValidationIssue[] = [];
  const hasAnyContent =
    rows.some((row) => row.key.trim().length > 0) ||
    rows.some(
      (row) =>
        row.type === 'object' &&
        row.children.some((child) => child.key.trim().length > 0),
    );
  if (!hasAnyContent && rows.length > 0) {
    const onlyBlank = rows.every((row) => row.key.trim().length === 0);
    if (!onlyBlank || rows.length > 1) {
      for (const row of rows) {
        if (row.key.trim().length === 0 && rows.length > 1) {
          issues.push({ code: 'empty_key', rowId: row.id });
        }
      }
    }
  }
  validateRowsAtLevel(rows, 0, issues);
  return issues;
}

export function isObjectBuilderValid(rows: ObjectBuilderRow[]): boolean {
  return validateRows(rows).length === 0;
}

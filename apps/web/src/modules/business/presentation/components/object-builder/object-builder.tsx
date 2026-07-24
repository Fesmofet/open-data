'use client';

import { useCallback, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  createEmptyArrayItem,
  createEmptyRow,
  OBJECT_BUILDER_LIMITS,
  recordToRows,
  rowsToRecord,
  validateRows,
  type ObjectBuilderArrayItem,
  type ObjectBuilderRow,
  type ObjectBuilderScalarType,
  type ObjectBuilderType,
  type ObjectBuilderValidationIssue,
} from '../../../domain/object-builder';

export type ObjectBuilderProps = {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>, valid: boolean) => void;
  label?: string;
  disabled?: boolean;
  maxProperties?: number;
};

const INPUT_CLASS =
  'min-w-0 flex-1 rounded-btn border border-border px-2 py-1.5 text-body-sm';
const SELECT_CLASS =
  'rounded-btn border border-border px-2 py-1.5 text-body-sm bg-surface';
const TRASH_CLASS =
  'shrink-0 rounded-btn border border-border px-2 py-1.5 text-body-sm text-fg-secondary hover:text-error disabled:opacity-50';

function issueMessage(
  t: (key: string) => string,
  issue: ObjectBuilderValidationIssue,
): string {
  switch (issue.code) {
    case 'empty_key':
      return t('business_object_builder_error_empty_key');
    case 'duplicate_key':
      return t('business_object_builder_error_duplicate_key');
    case 'dangerous_key':
      return t('business_object_builder_error_dangerous_key');
    case 'key_too_long':
      return t('business_object_builder_error_key_too_long');
    case 'max_properties':
      return t('business_object_builder_error_max_properties');
    default:
      return t('business_object_builder_error_empty_key');
  }
}

function typeLabel(t: (key: string) => string, type: ObjectBuilderType): string {
  switch (type) {
    case 'string':
      return t('business_object_builder_type_string');
    case 'number':
      return t('business_object_builder_type_number');
    case 'boolean':
      return t('business_object_builder_type_boolean');
    case 'null':
      return t('business_object_builder_type_null');
    case 'object':
      return t('business_object_builder_type_object');
    case 'array':
      return t('business_object_builder_type_array');
    default:
      return type;
  }
}

function countNestedProperties(children: ObjectBuilderRow[]): number {
  return children.filter((child) => child.key.trim().length > 0).length;
}

type ScalarValueEditorProps = {
  itemType: ObjectBuilderScalarType;
  value: string;
  boolValue: boolean;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onBoolChange: (value: boolean) => void;
};

function ScalarValueEditor({
  itemType,
  value,
  boolValue,
  disabled,
  onValueChange,
  onBoolChange,
}: ScalarValueEditorProps) {
  if (itemType === 'null') {
    return (
      <span className="flex-1 px-2 py-1.5 text-body-sm text-fg-secondary">null</span>
    );
  }
  if (itemType === 'boolean') {
    return (
      <label className="flex flex-1 items-center gap-2 px-2 py-1.5 text-body-sm">
        <input
          type="checkbox"
          checked={boolValue}
          disabled={disabled}
          onChange={(e) => onBoolChange(e.target.checked)}
        />
      </label>
    );
  }
  return (
    <input
      type="text"
      inputMode={itemType === 'number' ? 'decimal' : 'text'}
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
      className={INPUT_CLASS}
    />
  );
}

type ArrayItemsEditorProps = {
  items: ObjectBuilderArrayItem[];
  disabled: boolean;
  t: (key: string) => string;
  onChange: (items: ObjectBuilderArrayItem[]) => void;
};

function ArrayItemsEditor({ items, disabled, t, onChange }: ArrayItemsEditorProps) {
  return (
    <div className="flex flex-col gap-2 border-l-2 border-border pl-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center gap-2">
          <select
            value={item.type}
            disabled={disabled}
            onChange={(e) => {
              const nextType = e.target.value as ObjectBuilderScalarType;
              onChange(
                items.map((row) =>
                  row.id === item.id
                    ? {
                        ...row,
                        type: nextType,
                        value: nextType === 'null' ? '' : row.value,
                        boolValue: nextType === 'boolean' ? row.boolValue : false,
                      }
                    : row,
                ),
              );
            }}
            className={SELECT_CLASS}
          >
            {(['string', 'number', 'boolean', 'null'] as const).map((scalar) => (
              <option key={scalar} value={scalar}>
                {typeLabel(t, scalar)}
              </option>
            ))}
          </select>
          <ScalarValueEditor
            itemType={item.type}
            value={item.value}
            boolValue={item.boolValue}
            disabled={disabled}
            onValueChange={(next) =>
              onChange(
                items.map((row) => (row.id === item.id ? { ...row, value: next } : row)),
              )
            }
            onBoolChange={(next) =>
              onChange(
                items.map((row) =>
                  row.id === item.id ? { ...row, boolValue: next } : row,
                ),
              )
            }
          />
          <button
            type="button"
            disabled={disabled}
            className={TRASH_CLASS}
            aria-label={t('business_object_builder_remove')}
            onClick={() => onChange(items.filter((row) => row.id !== item.id))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        className="self-start rounded-btn border border-border px-3 py-1.5 text-caption"
        onClick={() => onChange([...items, createEmptyArrayItem()])}
      >
        {t('business_object_builder_add_item')}
      </button>
    </div>
  );
}

type PropertyRowsEditorProps = {
  rows: ObjectBuilderRow[];
  depth: number;
  disabled: boolean;
  maxProperties: number;
  issuesByRowId: Map<string, ObjectBuilderValidationIssue[]>;
  t: (key: string) => string;
  onChange: (rows: ObjectBuilderRow[]) => void;
};

function PropertyRowsEditor({
  rows,
  depth,
  disabled,
  maxProperties,
  issuesByRowId,
  t,
  onChange,
}: PropertyRowsEditorProps) {
  const allowObjectAndArray = depth === 0;
  const typeOptions: ObjectBuilderType[] = allowObjectAndArray
    ? ['string', 'number', 'boolean', 'null', 'object', 'array']
    : ['string', 'number', 'boolean', 'null'];

  const nonEmptyCount = rows.filter((row) => row.key.trim().length > 0).length;
  const atMax = nonEmptyCount >= maxProperties;

  function updateRow(rowId: string, patch: Partial<ObjectBuilderRow>) {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function removeRow(rowId: string) {
    const next = rows.filter((row) => row.id !== rowId);
    onChange(next.length > 0 ? next : [createEmptyRow()]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden gap-2 text-caption font-weight-label text-fg-secondary sm:grid sm:grid-cols-[1fr_auto_1fr_auto]">
        <span>{t('business_object_builder_col_key')}</span>
        <span>{t('business_object_builder_col_type')}</span>
        <span>{t('business_object_builder_col_value')}</span>
        <span className="sr-only">{t('business_object_builder_remove')}</span>
      </div>
      {rows.map((row) => {
        const rowIssues = issuesByRowId.get(row.id) ?? [];
        return (
          <div key={row.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start gap-2">
              <input
                type="text"
                value={row.key}
                disabled={disabled}
                placeholder={t('business_object_builder_key_placeholder')}
                onChange={(e) => updateRow(row.id, { key: e.target.value })}
                className={`${INPUT_CLASS} sm:max-w-[10rem]`}
              />
              <select
                value={row.type}
                disabled={disabled}
                onChange={(e) => {
                  const nextType = e.target.value as ObjectBuilderType;
                  const patch: Partial<ObjectBuilderRow> = { type: nextType };
                  if (nextType === 'object' && row.children.length === 0) {
                    patch.children = [createEmptyRow()];
                  }
                  if (nextType === 'array' && row.items.length === 0) {
                    patch.items = [createEmptyArrayItem()];
                  }
                  updateRow(row.id, patch);
                }}
                className={SELECT_CLASS}
              >
                {typeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {typeLabel(t, opt)}
                  </option>
                ))}
              </select>
              {row.type === 'object' ? (
                <span className="flex-1 px-2 py-1.5 text-body-sm text-fg-secondary">
                  {t('business_object_builder_edit_n_properties').replace(
                    '{count}',
                    String(countNestedProperties(row.children)),
                  )}
                </span>
              ) : row.type === 'array' ? null : (
                <ScalarValueEditor
                  itemType={row.type}
                  value={row.value}
                  boolValue={row.boolValue}
                  disabled={disabled}
                  onValueChange={(next) => updateRow(row.id, { value: next })}
                  onBoolChange={(next) => updateRow(row.id, { boolValue: next })}
                />
              )}
              <button
                type="button"
                disabled={disabled}
                className={TRASH_CLASS}
                aria-label={t('business_object_builder_remove')}
                onClick={() => removeRow(row.id)}
              >
                ×
              </button>
            </div>
            {rowIssues.length > 0 ? (
              <p className="text-caption text-error" role="alert">
                {rowIssues.map((issue) => issueMessage(t, issue)).join(' ')}
              </p>
            ) : null}
            {row.type === 'object' ? (
              <div className="ml-2 border-l-2 border-border pl-3">
                <PropertyRowsEditor
                  rows={row.children}
                  depth={depth + 1}
                  disabled={disabled}
                  maxProperties={maxProperties}
                  issuesByRowId={issuesByRowId}
                  t={t}
                  onChange={(children) => updateRow(row.id, { children })}
                />
              </div>
            ) : null}
            {row.type === 'array' ? (
              <ArrayItemsEditor
                items={row.items}
                disabled={disabled}
                t={t}
                onChange={(items) => updateRow(row.id, { items })}
              />
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        disabled={disabled || atMax}
        className="self-start rounded-btn border border-border px-3 py-1.5 text-caption disabled:opacity-50"
        onClick={() => onChange([...rows, createEmptyRow()])}
      >
        {t('business_object_builder_add_property')}
      </button>
    </div>
  );
}

export function ObjectBuilder({
  value,
  onChange,
  label,
  disabled = false,
  maxProperties = OBJECT_BUILDER_LIMITS.maxProperties,
}: ObjectBuilderProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState(() => {
    const initial = recordToRows(value);
    return initial.length > 0 ? initial : [createEmptyRow()];
  });

  const commitRows = useCallback(
    (next: ObjectBuilderRow[]) => {
      setRows(next);
      const issues = validateRows(next);
      onChange(rowsToRecord(next), issues.length === 0);
    },
    [onChange],
  );

  const issues = useMemo(() => validateRows(rows), [rows]);
  const issuesByRowId = useMemo(() => {
    const map = new Map<string, ObjectBuilderValidationIssue[]>();
    for (const issue of issues) {
      if (issue.rowId) {
        const list = map.get(issue.rowId) ?? [];
        list.push(issue);
        map.set(issue.rowId, list);
      }
    }
    return map;
  }, [issues]);

  const globalIssues = issues.filter((issue) => !issue.rowId);
  const previewJson = useMemo(
    () => JSON.stringify(rowsToRecord(rows), null, 2),
    [rows],
  );

  return (
    <div className="flex flex-col gap-2 text-body-sm">
      {label ? <span className="font-weight-label">{label}</span> : null}
      <p className="text-caption text-fg-secondary">
        {t('business_object_builder_custom_properties')}
      </p>
      <PropertyRowsEditor
        rows={rows}
        depth={0}
        disabled={disabled}
        maxProperties={maxProperties}
        issuesByRowId={issuesByRowId}
        t={t}
        onChange={commitRows}
      />
      {globalIssues.length > 0 ? (
        <p className="text-caption text-error" role="alert">
          {globalIssues.map((issue) => issueMessage(t, issue)).join(' ')}
        </p>
      ) : null}
      <details className="rounded-btn border border-border px-3 py-2">
        <summary className="cursor-pointer text-caption font-weight-label">
          {t('business_object_builder_json_preview')}
        </summary>
        <pre className="mt-2 overflow-x-auto font-mono text-caption text-fg-secondary">
          {previewJson}
        </pre>
      </details>
    </div>
  );
}

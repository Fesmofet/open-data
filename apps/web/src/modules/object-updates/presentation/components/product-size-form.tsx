'use client';

import { DIMENSION_UNITS } from '@opden-data-layer/core/update-registry';
import { useEffect } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

export type ProductSizeFormProps = {
  value: unknown;
  onChange: (value: unknown) => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function numberFieldText(raw: unknown): string {
  return raw === '' || raw === undefined || raw === null ? '' : String(raw);
}

export function ProductSizeForm({ value, onChange }: ProductSizeFormProps) {
  const { t } = useI18n();
  const obj = asRecord(value);
  const unit =
    typeof obj.unit === 'string' &&
    DIMENSION_UNITS.includes(obj.unit as (typeof DIMENSION_UNITS)[number])
      ? obj.unit
      : DIMENSION_UNITS[0];

  function patch(next: Record<string, unknown>) {
    onChange({ ...obj, ...next });
  }

  useEffect(() => {
    if (
      typeof obj.unit !== 'string' ||
      !DIMENSION_UNITS.includes(obj.unit as (typeof DIMENSION_UNITS)[number])
    ) {
      onChange({
        length: obj.length === undefined || obj.length === null ? '' : obj.length,
        width: obj.width === undefined || obj.width === null ? '' : obj.width,
        depth: obj.depth === undefined || obj.depth === null ? '' : obj.depth,
        unit: DIMENSION_UNITS[0],
      });
    }
  }, [obj.depth, obj.length, obj.unit, obj.width, onChange]);

  return (
    <fieldset className="space-y-3 text-body-sm">
      <label className="block">
        <span className="font-weight-label text-fg">{t('object_edit_size_length')}</span>
        <input
          type="number"
          min={0}
          step="any"
          className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={numberFieldText(obj.length)}
          onChange={(e) => patch({ length: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="font-weight-label text-fg">{t('object_edit_size_width')}</span>
        <input
          type="number"
          min={0}
          step="any"
          className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={numberFieldText(obj.width)}
          onChange={(e) => patch({ width: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="font-weight-label text-fg">{t('object_edit_size_depth')}</span>
        <input
          type="number"
          min={0}
          step="any"
          className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={numberFieldText(obj.depth)}
          onChange={(e) => patch({ depth: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="font-weight-label text-fg">{t('object_edit_size_unit')}</span>
        <select
          className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={unit}
          onChange={(e) => patch({ unit: e.target.value })}
        >
          {DIMENSION_UNITS.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

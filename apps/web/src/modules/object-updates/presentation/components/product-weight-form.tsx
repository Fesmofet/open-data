'use client';

import { WEIGHT_UNITS } from '@opden-data-layer/core/update-registry';
import { useEffect } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

export type ProductWeightFormProps = {
  value: unknown;
  onChange: (value: unknown) => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function ProductWeightForm({ value, onChange }: ProductWeightFormProps) {
  const { t } = useI18n();
  const obj = asRecord(value);
  const rawValue = obj.value;
  const valueText =
    rawValue === '' || rawValue === undefined || rawValue === null
      ? ''
      : String(rawValue);
  const unit =
    typeof obj.unit === 'string' && WEIGHT_UNITS.includes(obj.unit as (typeof WEIGHT_UNITS)[number])
      ? obj.unit
      : WEIGHT_UNITS[0];

  function patch(next: Record<string, unknown>) {
    onChange({ ...obj, ...next });
  }

  useEffect(() => {
    if (typeof obj.unit !== 'string' || !WEIGHT_UNITS.includes(obj.unit as (typeof WEIGHT_UNITS)[number])) {
      onChange({
        value: rawValue === undefined || rawValue === null ? '' : rawValue,
        unit: WEIGHT_UNITS[0],
      });
    }
  }, [obj.unit, onChange, rawValue]);

  return (
    <fieldset className="space-y-3 text-body-sm">
      <label className="block">
        <span className="font-weight-label text-fg">{t('object_field_productWeight')}</span>
        <input
          type="number"
          min={0}
          step="any"
          className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={valueText}
          onChange={(e) => patch({ value: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="font-weight-label text-fg">{t('object_edit_product_weight_unit')}</span>
        <select
          className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={unit}
          onChange={(e) => patch({ unit: e.target.value })}
        >
          {WEIGHT_UNITS.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

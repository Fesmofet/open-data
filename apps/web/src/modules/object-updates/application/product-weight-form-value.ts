import { WEIGHT_UNITS } from '@opden-data-layer/core/update-registry';

const UNIT_SET = new Set<string>(WEIGHT_UNITS);

export function sanitizeProductWeightFormValue(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const value = Number(raw.value);
  const unit = typeof raw.unit === 'string' ? raw.unit.trim() : '';
  return {
    value: Number.isFinite(value) ? value : Number.NaN,
    unit: UNIT_SET.has(unit) ? unit : WEIGHT_UNITS[0],
  };
}

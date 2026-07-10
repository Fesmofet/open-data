import { DIMENSION_UNITS } from '@opden-data-layer/core/update-registry';

const UNIT_SET = new Set<string>(DIMENSION_UNITS);

export function sanitizeProductSizeFormValue(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const length = Number(raw.length);
  const width = Number(raw.width);
  const depth = Number(raw.depth);
  const unit = typeof raw.unit === 'string' ? raw.unit.trim() : '';
  return {
    length: Number.isFinite(length) ? length : Number.NaN,
    width: Number.isFinite(width) ? width : Number.NaN,
    depth: Number.isFinite(depth) ? depth : Number.NaN,
    unit: UNIT_SET.has(unit) ? unit : DIMENSION_UNITS[0],
  };
}

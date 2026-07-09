import type { ObjectOptionsResponseDto } from './schemas/object-options.schema';

export interface RawOptionRow {
  category: string;
  value: string;
  position: number;
  image?: string;
}

export interface ProjectedSiblingForOptions {
  object_id: string;
  optionRows: RawOptionRow[];
  price: string | null;
  imageUrl: string | null;
}

function isOptionJson(v: unknown): v is RawOptionRow {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) {
    return false;
  }
  const row = v as Record<string, unknown>;
  return (
    typeof row.category === 'string' &&
    row.category.trim().length > 0 &&
    typeof row.value === 'string' &&
    row.value.trim().length > 0
  );
}

export function parseOptionRowsFromFields(fields: Record<string, unknown>): RawOptionRow[] {
  const raw = fields.option;
  if (!Array.isArray(raw)) {
    return [];
  }
  const rows: RawOptionRow[] = [];
  for (const item of raw) {
    if (!isOptionJson(item)) {
      continue;
    }
    rows.push({
      category: item.category.trim(),
      value: item.value.trim(),
      position: typeof item.position === 'number' && Number.isFinite(item.position) ? item.position : 1,
      image: typeof item.image === 'string' && item.image.trim().length > 0 ? item.image.trim() : undefined,
    });
  }
  return rows;
}

export function readProjectedPrice(fields: Record<string, unknown>): string | null {
  const price = fields.price;
  return typeof price === 'string' && price.trim().length > 0 ? price.trim() : null;
}

export function readProjectedImageUrl(fields: Record<string, unknown>): string | null {
  const image = fields.image;
  return typeof image === 'string' && image.trim().length > 0 ? image.trim() : null;
}

function compareOptionEntries(
  a: ObjectOptionsResponseDto['options'][string][number],
  b: ObjectOptionsResponseDto['options'][string][number],
): number {
  if (a.position !== b.position) {
    return a.position - b.position;
  }
  return a.value.localeCompare(b.value, undefined, { sensitivity: 'base' });
}

/**
 * Merges option rows from product-group siblings, dedupes by value per category, sorts by position then value.
 */
export function aggregateObjectOptions(
  objectId: string,
  siblings: ProjectedSiblingForOptions[],
): ObjectOptionsResponseDto {
  const byCategory = new Map<string, Map<string, ObjectOptionsResponseDto['options'][string][number]>>();

  for (const sibling of siblings) {
    for (const row of sibling.optionRows) {
      let categoryMap = byCategory.get(row.category);
      if (!categoryMap) {
        categoryMap = new Map();
        byCategory.set(row.category, categoryMap);
      }
      const existing = categoryMap.get(row.value);
      if (existing) {
        continue;
      }
      categoryMap.set(row.value, {
        object_id: sibling.object_id,
        category: row.category,
        value: row.value,
        position: row.position,
        image: row.image ?? null,
        price: sibling.price,
        imageUrl: sibling.imageUrl,
      });
    }
  }

  const options: ObjectOptionsResponseDto['options'] = {};
  for (const [category, valueMap] of byCategory.entries()) {
    options[category] = [...valueMap.values()].sort(compareOptionEntries);
  }

  return { object_id: objectId, options };
}

export function emptyObjectOptionsResponse(objectId: string): ObjectOptionsResponseDto {
  return { object_id: objectId, options: {} };
}

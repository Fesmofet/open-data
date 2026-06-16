import type { ProjectedObject } from '../object-projection';

export function projectedObjectDisplayName(projected: ProjectedObject): string {
  const raw = projected.fields.name;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return projected.object_id;
}

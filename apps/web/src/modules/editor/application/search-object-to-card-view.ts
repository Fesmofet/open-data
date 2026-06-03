import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

/** Maps search hits to `ObjectCard` input (minimal fields). */
export function searchObjectResultToObjectView(
  result: SearchObjectResult,
): ProjectedObjectView {
  const fields: Record<string, unknown> = {};
  const name = result.name?.trim();
  if (name) {
    fields.name = name;
  }
  if (result.image_url) {
    fields.image = result.image_url;
  }
  const parent = result.parent_name?.trim();
  if (parent) {
    fields.description = parent;
  }

  return {
    object_id: result.object_id,
    object_type: result.object_type,
    semantic_type: null,
    weight: 0,
    fields,
    hasAdministrativeAuthority: false,
    hasOwnershipAuthority: false,
  };
}

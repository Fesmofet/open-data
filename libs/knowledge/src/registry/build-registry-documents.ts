import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';
import { UPDATE_REGISTRY } from '@opden-data-layer/core/update-registry';
import { serializeObjectType } from './object-type-serializer';
import { serializeUpdateType } from './update-type-serializer';

export interface RegistryDocument {
  path: string;
  content: string;
}

export function buildRegistryDocuments(): RegistryDocument[] {
  const docs: RegistryDocument[] = [];

  for (const [objectType, def] of Object.entries(OBJECT_TYPE_REGISTRY)) {
    docs.push({
      path: `registry/object-type/${objectType}.md`,
      content: serializeObjectType(objectType, def),
    });
  }

  for (const [updateType, def] of Object.entries(UPDATE_REGISTRY)) {
    docs.push({
      path: `registry/update-type/${updateType}.md`,
      content: serializeUpdateType(updateType, def),
    });
  }

  return docs;
}

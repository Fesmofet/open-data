import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';
import { UPDATE_REGISTRY } from '@opden-data-layer/core/update-registry';
import {
  objectTypeExamplePayload,
  serializeObjectType,
} from './object-type-serializer';
import {
  updateSchemaToJson,
  updateTypeExamplePayload,
  serializeUpdateType,
} from './update-type-serializer';

export function listObjectTypes(): Array<{ object_type: string; description: string | null }> {
  return Object.entries(OBJECT_TYPE_REGISTRY)
    .map(([object_type, def]) => ({
      object_type,
      description: def.description ?? null,
    }))
    .sort((a, b) => a.object_type.localeCompare(b.object_type));
}

export function getObjectType(objectType: string): {
  object_type: string;
  description: string | null;
  supported_updates: string[];
  supposed_updates: Array<{ update_type: string; values: unknown }>;
  markdown: string;
  example_create_payload: string;
} | null {
  const def = OBJECT_TYPE_REGISTRY[objectType];
  if (!def) return null;
  return {
    object_type: objectType,
    description: def.description ?? null,
    supported_updates: [...def.supported_updates].sort(),
    supposed_updates: def.supposed_updates.map((s) => ({
      update_type: s.update_type,
      values: s.values,
    })),
    markdown: serializeObjectType(objectType, def),
    example_create_payload: objectTypeExamplePayload(objectType),
  };
}

export function listUpdateTypes(): Array<{
  update_type: string;
  description: string | null;
  cardinality: string;
  value_kind: string;
}> {
  return Object.entries(UPDATE_REGISTRY)
    .map(([update_type, def]) => ({
      update_type,
      description: def.description ?? null,
      cardinality: def.cardinality,
      value_kind: def.value_kind,
    }))
    .sort((a, b) => a.update_type.localeCompare(b.update_type));
}

export function getUpdateSchema(updateType: string): {
  update_type: string;
  description: string | null;
  cardinality: string;
  value_kind: string;
  json_schema: Record<string, unknown> | null;
  example_payload: string;
  markdown: string;
} | null {
  const def = UPDATE_REGISTRY[updateType];
  if (!def) return null;
  return {
    update_type: updateType,
    description: def.description ?? null,
    cardinality: def.cardinality,
    value_kind: def.value_kind,
    json_schema: updateSchemaToJson(def),
    example_payload: updateTypeExamplePayload(def.value_kind, updateType),
    markdown: serializeUpdateType(updateType, def),
  };
}

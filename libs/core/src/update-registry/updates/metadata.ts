import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_METADATA_SCHEMA = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const UPDATE_METADATA: UpdateDefinition = {
  update_type: UPDATE_TYPES.METADATA,
  namespace: 'odl',
  localizable: false,
  description: 'Skill metadata key/value pair (projected as one object).',
  value_kind: 'json',
  cardinality: 'multi',
  schema: UPDATE_METADATA_SCHEMA,
};

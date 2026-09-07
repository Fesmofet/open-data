import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_REFERENCES: UpdateDefinition = {
  update_type: UPDATE_TYPES.REFERENCES,
  namespace: 'odl',
  localizable: false,
  description: 'Referenced ODL object (supporting docs, related skills, etc.).',
  value_kind: 'object_ref',
  cardinality: 'multi',
  schema: z.string().min(3).max(256),
};

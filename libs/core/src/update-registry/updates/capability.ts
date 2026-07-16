import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_CAPABILITY: UpdateDefinition = {
  update_type: UPDATE_TYPES.CAPABILITY,
  namespace: 'odl',
  localizable: false,
  description: 'Agent capability tag (e.g. image-generation).',
  value_kind: 'text',
  cardinality: 'multi',
  schema: z.string().min(1).max(64),
};

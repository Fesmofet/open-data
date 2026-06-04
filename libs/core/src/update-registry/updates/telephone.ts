import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_TELEPHONE_SCHEMA = z.object({
  title: z.string().max(128).optional(),
  value: z.string().min(1),
});

export const UPDATE_TELEPHONE: UpdateDefinition = {
  update_type: UPDATE_TYPES.TELEPHONE,
  semantic_key: 'telephone',
  namespace: 'schema',
  localizable: true,
  description: 'Phone number or contact.',
  value_kind: 'json',
  cardinality: 'multi',
  schema: UPDATE_TELEPHONE_SCHEMA,
};

import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_SKILL_CONTENT: UpdateDefinition = {
  update_type: UPDATE_TYPES.SKILL_CONTENT,
  namespace: 'odl',
  localizable: true,
  description: 'Skill body (markdown instructions).',
  value_kind: 'text',
  cardinality: 'single',
  schema: z.string().min(1),
};

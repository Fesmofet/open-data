import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_LEGAL_TEXT: UpdateDefinition = {
  update_type: UPDATE_TYPES.LEGAL_TEXT,
  namespace: 'odl',
  localizable: true,
  description: 'Legal document body (markdown).',
  value_kind: 'text',
  cardinality: 'single',
  schema: z.string().min(1),
};

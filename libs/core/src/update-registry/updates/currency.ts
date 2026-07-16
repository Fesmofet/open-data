import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_CURRENCY: UpdateDefinition = {
  update_type: UPDATE_TYPES.CURRENCY,
  namespace: 'odl',
  localizable: false,
  description: 'Preferred settlement currency (e.g. USD, WAIV).',
  value_kind: 'text',
  cardinality: 'single',
  schema: z.string().min(2).max(16),
};

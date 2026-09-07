import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_COMPATIBILITY: UpdateDefinition = {
  update_type: UPDATE_TYPES.COMPATIBILITY,
  namespace: 'odl',
  localizable: false,
  description:
    'Environment requirements: intended products, system packages, network access, etc.',
  value_kind: 'text',
  cardinality: 'single',
  schema: z.string().min(1).max(500),
};

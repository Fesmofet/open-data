import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const UPDATE_SLA_SCHEMA = z.object({
  response_time_sec: z.number().int().positive().optional(),
  uptime_pct: z.number().min(0).max(100).optional(),
  notes: z.string().max(512).optional(),
});

export const UPDATE_SLA: UpdateDefinition = {
  update_type: UPDATE_TYPES.SLA,
  namespace: 'odl',
  localizable: false,
  description: 'Service level agreement hints.',
  value_kind: 'json',
  cardinality: 'single',
  schema: UPDATE_SLA_SCHEMA,
};

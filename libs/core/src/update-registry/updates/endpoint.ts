import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';

export const ENDPOINT_PROTOCOLS = ['mcp', 'a2a', 'api', 'rest'] as const;

export const UPDATE_ENDPOINT_SCHEMA = z.object({
  protocol: z.enum(ENDPOINT_PROTOCOLS),
  url: z.string().url(),
  auth: z.string().max(64).optional(),
  description: z.string().max(256).optional(),
});

export const UPDATE_ENDPOINT: UpdateDefinition = {
  update_type: UPDATE_TYPES.ENDPOINT,
  namespace: 'odl',
  localizable: false,
  description: 'Service endpoint (MCP/A2A/API/REST URL).',
  value_kind: 'json',
  cardinality: 'multi',
  schema: UPDATE_ENDPOINT_SCHEMA,
};

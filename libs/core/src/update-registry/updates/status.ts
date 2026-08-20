import { z } from 'zod';
import type { UpdateDefinition } from '../types';
import { UPDATE_TYPES } from '../update-types';
import {
  OBJECT_STATUS_VALUES,
  type ObjectStatus,
} from '@opden-data-layer/odl-db-types';

export { OBJECT_STATUS_VALUES, type ObjectStatus };

/** Statuses allowed on direct object page resolve (`/object/:id`). Currently all values. */
export const OBJECT_PAGE_VISIBLE_STATUSES: readonly ObjectStatus[] =
  OBJECT_STATUS_VALUES;

export const UPDATE_STATUS_SCHEMA = z
  .object({
    title: z.enum(OBJECT_STATUS_VALUES),
    link: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.title === 'relisted' && !data.link?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['link'],
        message: 'Link is required when status is relisted',
      });
    }
  });

export const UPDATE_STATUS: UpdateDefinition = {
  update_type: UPDATE_TYPES.STATUS,
  namespace: 'odl',
  localizable: false,
  description: 'Status payload (title and link).',
  value_kind: 'json',
  cardinality: 'single',
  schema: UPDATE_STATUS_SCHEMA,
};

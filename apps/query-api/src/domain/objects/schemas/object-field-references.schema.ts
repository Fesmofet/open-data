import { z } from 'zod';
import type { RefSummaryDto } from './object-ref-list.schema';
import { objectRefListQuerySchema } from './object-ref-list.schema';

export const objectFieldReferencesSummaryQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(6)
    .describe('Preview page size per group (default 6 for right-rail hasMore detection)'),
});

export type ObjectFieldReferencesSummaryQuery = z.infer<
  typeof objectFieldReferencesSummaryQuerySchema
>;

export type ObjectFieldReferenceGroupDto = {
  objectType: string;
  items: RefSummaryDto[];
  hasMore: boolean;
};

export type ObjectFieldReferencesSummaryResponseDto = {
  groups: ObjectFieldReferenceGroupDto[];
};

export { objectRefListQuerySchema as objectFieldReferencesByTypeQuerySchema };
export type { ObjectRefListQuery as ObjectFieldReferencesByTypeQuery } from './object-ref-list.schema';
export type { ObjectRefListResponseDto as ObjectFieldReferencesByTypeResponseDto } from './object-ref-list.schema';

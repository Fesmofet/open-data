import { z } from 'zod';

export const resolveNestedObjectsBodySchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .max(32)
    .describe('Object ids to resolve (max 32, lightweight projection)'),
});

export type ResolveNestedObjectsBody = z.infer<typeof resolveNestedObjectsBodySchema>;

export type NestedObjectView = {
  object_id: string;
  object_type: string;
  fields: Record<string, unknown>;
};

export type ResolveNestedObjectsResponse = {
  items: NestedObjectView[];
};

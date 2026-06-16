import { z } from 'zod';

export const profilePostObjectFilterItemSchema = z.object({
  object_id: z.string(),
  name: z.string(),
  count: z.number().int(),
});

export const profilePostObjectFiltersResponseSchema = z.object({
  items: z.array(profilePostObjectFilterItemSchema),
});

export type ProfilePostObjectFilterItem = z.infer<typeof profilePostObjectFilterItemSchema>;
export type ProfilePostObjectFiltersResponse = z.infer<
  typeof profilePostObjectFiltersResponseSchema
>;

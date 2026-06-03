import { z } from 'zod';

/** Max linked objects per post editor draft (aligned with web `MAX_POST_EDITOR_ATTACHED_OBJECTS`). */
export const SEARCH_OBJECTS_BY_IDS_MAX = 100;

export const searchObjectsByIdsBodySchema = z.object({
  object_ids: z
    .array(z.string().min(1))
    .min(1)
    .max(SEARCH_OBJECTS_BY_IDS_MAX),
});

export type SearchObjectsByIdsBody = z.infer<typeof searchObjectsByIdsBodySchema>;

export const searchObjectsByIdsResponseSchema = z.object({
  objects: z.array(
    z.object({
      object_id: z.string(),
      object_type: z.string(),
      name: z.string().nullable(),
      image_url: z.string().nullable(),
      parent_name: z.string().nullable(),
    }),
  ),
});

export type SearchObjectsByIdsResponseDto = z.infer<
  typeof searchObjectsByIdsResponseSchema
>;

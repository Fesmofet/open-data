import { z } from 'zod';

const profileShopTagCategoryItemSchema = z.object({
  value: z.string(),
  count: z.number().int(),
});

const profileShopTagCategorySectionSchema = z.object({
  category: z.string(),
  items: z.array(profileShopTagCategoryItemSchema),
});

export const profileShopFiltersResponseSchema = z.object({
  ratings: z.array(z.number()),
  categories: z.array(profileShopTagCategorySectionSchema),
});

export type ProfileShopFiltersResponse = z.infer<typeof profileShopFiltersResponseSchema>;

export type ProfileShopTagCategorySection =
  ProfileShopFiltersResponse['categories'][number];

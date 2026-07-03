import { z } from 'zod';

export const userExpertiseScopeSchema = z.enum(['hashtags', 'objects']);

export const userExpertiseObjectsQuerySchema = z.object({
  scope: userExpertiseScopeSchema,
  skip: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export type UserExpertiseObjectsQuery = z.infer<typeof userExpertiseObjectsQuerySchema>;

export type UserExpertiseCountersResponse = {
  hashtagsCount: number;
  objectsCount: number;
};

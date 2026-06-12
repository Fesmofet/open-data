import { z } from 'zod';

export const postVoterProfileSchema = z.object({
  name: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const postVoterRowSchema = z.object({
  voter: z.string(),
  percent: z.number(),
  valueUsd: z.number(),
  valueLabel: z.string(),
  profile: postVoterProfileSchema,
});

export const postVotersPageApiSchema = z.object({
  upvoteCount: z.number(),
  downvoteCount: z.number(),
  items: z.array(postVoterRowSchema),
  nextCursor: z.string().nullable(),
});

export type PostVotersPageApi = z.infer<typeof postVotersPageApiSchema>;
export type PostVoterRowView = z.infer<typeof postVoterRowSchema>;
export type PostVotersPageView = z.infer<typeof postVotersPageApiSchema>;

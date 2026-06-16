import { z } from 'zod';

export const updateVoterProfileSchema = z.object({
  name: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const updateVoterRowSchema = z.object({
  voter: z.string(),
  event_seq: z.string(),
  privileged_tier: z.enum(['admin', 'trusted']).nullable(),
  profile: updateVoterProfileSchema,
});

export const updateVotersResponseSchema = z.object({
  for_count: z.number().int(),
  against_count: z.number().int(),
  for_voters: z.array(updateVoterRowSchema),
  against_voters: z.array(updateVoterRowSchema),
});

export type UpdateVoterRowView = z.infer<typeof updateVoterRowSchema>;
export type UpdateVotersResponseView = z.infer<typeof updateVotersResponseSchema>;

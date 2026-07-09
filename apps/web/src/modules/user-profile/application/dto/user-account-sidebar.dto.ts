import { z } from 'zod';

const tokenBlockSchema = z.object({
  upvotingManaPercent: z.number(),
  downvotingManaPercent: z.number(),
  voteValueUsd: z.number(),
});

const hiveBlockSchema = tokenBlockSchema.extend({
  reputation: z.number(),
  resourceCreditsPercent: z.number(),
});

const socialLinkSchema = z.object({
  type: z.string(),
  value: z.string(),
  href: z.string(),
});

const cryptoWalletSchema = z.object({
  id: z.string(),
  label: z.string(),
  shortName: z.string(),
  abbreviation: z.string(),
  address: z.string(),
  icon: z.string(),
  coingeckoId: z.string(),
});

export const userAccountSidebarViewSchema = z.object({
  about: z.string(),
  location: z.string().nullable(),
  website: z.string().nullable(),
  email: z.string().nullable(),
  joinedAt: z.string().nullable(),
  expertiseWeight: z.number(),
  lastActivityAt: z.string().nullable(),
  totalVoteValueUsd: z.number(),
  socialLinks: z.array(socialLinkSchema).default([]),
  cryptoWallets: z.array(cryptoWalletSchema).default([]),
  waiv: tokenBlockSchema,
  hive: hiveBlockSchema,
});

export type UserAccountSidebarViewDto = z.infer<typeof userAccountSidebarViewSchema>;

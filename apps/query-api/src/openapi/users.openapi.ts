import { z } from 'zod';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';

const notFoundSchema = z.object({
  statusCode: z.literal(404),
  message: z.string(),
  error: z.string(),
});

const userProfileViewSchema = registry.register(
  'UserProfileView',
  z.object({
    name: z.string().openapi({ description: 'Hive account name (primary key).' }),
    displayName: z.string().openapi({
      description:
        'Display name: `alias`, then `posting_json_metadata.profile.name`, then `name`.',
    }),
    bio: z.string().openapi({ description: 'About text from posting metadata.' }),
    avatarUrl: z.string().nullable().openapi({
      description: '`profile_image` or `posting_json_metadata.profile.profile_image`.',
    }),
    coverImageUrl: z.string().nullable().openapi({
      description: '`posting_json_metadata.profile.cover_image`.',
    }),
    followerCount: z.number().int().openapi({ description: '`followers_count`.' }),
    followingCount: z.number().int().openapi({ description: '`users_following_count`.' }),
    postingCount: z.number().int().openapi({ description: '`post_count`.' }),
    reputation: z.number().int().openapi({ description: '`object_reputation`.' }),
    wobjectsWeight: z.number().openapi({
      description: '`accounts_current.wobjects_weight` — Waivio user expertise rank.',
    }),
    is_following: z.boolean().openapi({
      description:
        'True when `X-Viewer` has a `user_subscriptions` row following this profile.',
    }),
    viewer_bell: z.boolean().openapi({
      description:
        'Bell on that subscription (`user_subscriptions.bell`); false when not following or bell is null.',
    }),
  }),
);

const accountNameParam = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9.-]+$/)
  .openapi({
    param: {
      name: 'name',
      in: 'path',
      required: true,
    },
    description: 'Hive account name (URL segment).',
    example: 'demo',
  });

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/profile',
  tags: [queryApiOpenApiTags.users],
  summary: 'Get user profile by account name',
  description:
    'Loads `accounts_current` by `name`, maps display fields from `alias`, `profile_image`, and parsed `posting_json_metadata`. When `X-Viewer` is set, includes `is_following` and `viewer_bell` from `user_subscriptions`.',
  request: {
    params: z.object({ name: accountNameParam }),
    headers: z.object({
      'x-viewer': z.string().optional().openapi({
        description:
          'Optional Hive account viewing the profile; used for `is_following` and `viewer_bell`.',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Public profile fields for the shell UI.',
      content: {
        'application/json': {
          schema: userProfileViewSchema,
        },
      },
    },
    404: {
      description: 'No row in `accounts_current` for `name`.',
      content: {
        'application/json': {
          schema: notFoundSchema,
        },
      },
    },
  },
});

const userAccountSidebarWaivSchema = z.object({
  upvotingManaPercent: z.number(),
  downvotingManaPercent: z.number(),
  voteValueUsd: z.number(),
});

const userAccountSidebarHiveSchema = z.object({
  reputation: z.number(),
  upvotingManaPercent: z.number(),
  downvotingManaPercent: z.number(),
  resourceCreditsPercent: z.number(),
  voteValueUsd: z.number(),
});

const userAccountSidebarSocialLinkSchema = z.object({
  type: z.string(),
  value: z.string(),
  href: z.string(),
});

const userAccountSidebarCryptoWalletSchema = z.object({
  id: z.string(),
  label: z.string(),
  shortName: z.string(),
  abbreviation: z.string(),
  address: z.string(),
  icon: z.string(),
  coingeckoId: z.string(),
});

const userAccountSidebarViewSchema = registry.register(
  'UserAccountSidebarView',
  z.object({
    about: z.string(),
    location: z.string().nullable(),
    website: z.string().nullable(),
    email: z.string().nullable(),
    joinedAt: z.string().nullable(),
    expertiseWeight: z.number(),
    lastActivityAt: z.string().nullable(),
    totalVoteValueUsd: z.number(),
    socialLinks: z.array(userAccountSidebarSocialLinkSchema),
    cryptoWallets: z.array(userAccountSidebarCryptoWalletSchema),
    waiv: userAccountSidebarWaivSchema,
    hive: userAccountSidebarHiveSchema,
  }),
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/account-sidebar',
  tags: [queryApiOpenApiTags.users],
  summary: 'Get profile left-sidebar account panel',
  description:
    'Aggregates posting metadata, expertise, last activity, Hive/Engine mana, RC, and estimated vote values for the profile left rail.',
  request: {
    params: z.object({ name: accountNameParam }),
  },
  responses: {
    200: {
      description: 'Account sidebar fields (legacy UserInfo parity).',
      content: {
        'application/json': {
          schema: userAccountSidebarViewSchema,
        },
      },
    },
    404: {
      description: 'No row in `accounts_current` for `name`.',
      content: {
        'application/json': {
          schema: notFoundSchema,
        },
      },
    },
  },
});

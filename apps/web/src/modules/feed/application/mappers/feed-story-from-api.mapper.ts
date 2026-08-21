import { z } from 'zod';

import type { FeedStoryView } from '../dto/feed-story.dto';
import { postRewardSchema } from '../dto/post-reward.dto';

const projectedObjectApiSchema = z.object({
  object_id: z.string(),
  object_type: z.string(),
  semantic_type: z.string().nullable(),
  fields: z.record(z.string(), z.unknown()),
  isFavorited: z.boolean().optional().default(false),
  hasSupervisedOwnership: z.boolean().optional().default(false),
  hasExclusiveOwnership: z.boolean().optional().default(false),
  seo: z.record(z.string(), z.unknown()).optional(),
});

export const feedStoryItemApiSchema = z.object({
  id: z.string(),
  author: z.string(),
  permlink: z.string(),
  title: z.string(),
  excerpt: z.string(),
  createdAt: z.string(),
  feedAt: z.string(),
  rebloggedBy: z.string().nullable(),
  rebloggedByViewer: z.boolean().optional().default(false),
  isNsfw: z.boolean(),
  category: z.string().nullable(),
  children: z.number(),
  pendingPayout: z.string(),
  totalPayout: z.string(),
  netRshares: z.string(),
  thumbnailUrl: z.string().nullable(),
  videoThumbnailUrl: z.string().nullable(),
  videoEmbedUrl: z.string().nullable(),
  authorProfile: z.object({
    name: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    reputation: z.number(),
    wobjectsWeight: z.number().nullish().default(0),
  }),
  objects: z.array(projectedObjectApiSchema),
  votes: z.object({
    totalCount: z.number(),
    previewVoters: z.array(z.string()),
    voted: z.boolean().optional().default(false),
  }),
  reward: postRewardSchema.nullable().optional(),
  waivRewardEligible: z.boolean().optional().default(false),
  pin: z.boolean().optional(),
  hasPinUpdate: z.boolean().optional(),
  hasRemoveUpdate: z.boolean().optional(),
});

/** Single-post endpoint: same as feed item plus full `body`. */
export const singlePostApiSchema = feedStoryItemApiSchema.extend({
  body: z.string(),
});

/** Discussion comment: feed card fields plus full Hive `body`. */
export const discussionCommentApiSchema = feedStoryItemApiSchema.extend({
  body: z.string(),
});

export type DiscussionCommentApi = z.infer<typeof discussionCommentApiSchema>;

export const userBlogFeedResponseSchema = z.object({
  items: z.array(feedStoryItemApiSchema),
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type FeedStoryItemApi = z.infer<typeof feedStoryItemApiSchema>;

export type DiscussionCommentView = FeedStoryView & { body: string };

export function mapFeedStoryItemApiToView(item: FeedStoryItemApi): FeedStoryView {
  return {
    id: item.id,
    authorName: item.author,
    permlink: item.permlink,
    authorDisplayName: item.authorProfile.displayName ?? undefined,
    authorAvatarUrl: item.authorProfile.avatarUrl ?? undefined,
    authorReputation: item.authorProfile.reputation,
    authorWobjectsWeight: item.authorProfile.wobjectsWeight ?? 0,
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    videoThumbnailUrl: item.videoThumbnailUrl ?? undefined,
    videoEmbedUrl: item.videoEmbedUrl ?? undefined,
    createdAt: item.createdAt,
    feedAt: item.feedAt,
    title: item.title || undefined,
    excerpt: item.excerpt,
    isNsfw: item.isNsfw,
    category: item.category,
    /** Public URL `/@author/permlink` (rewritten to `user-profile/.../post/permlink`); see `proxy.ts`. */
    permalinkPath: `/@${encodeURIComponent(item.author)}/${encodeURIComponent(item.permlink)}`,
    rebloggedBy: item.rebloggedBy,
    rebloggedByViewer: item.rebloggedByViewer,
    children: item.children,
    pendingPayout: item.pendingPayout,
    totalPayout: item.totalPayout,
    netRshares: item.netRshares,
    objects: item.objects,
    votes: item.votes,
    reward: item.reward ?? null,
    waivRewardEligible: item.waivRewardEligible ?? false,
    pin: item.pin,
    hasPinUpdate: item.hasPinUpdate,
    hasRemoveUpdate: item.hasRemoveUpdate,
  };
}

export function mapDiscussionCommentApiToView(
  item: DiscussionCommentApi,
): DiscussionCommentView {
  return {
    ...mapFeedStoryItemApiToView(item),
    body: item.body,
  };
}

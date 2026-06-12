import type { SupportedCurrency } from '@opden-data-layer/core';

import type { ProjectedObject } from '../object-projection';

export interface MoneyLineDto {
  amount: number;
  currency: string;
  label: string;
}

export interface PostRewardBeneficiaryDto {
  account: string;
  percent: number;
  payout?: MoneyLineDto;
}

export interface PostRewardBreakdownDto {
  waiv: MoneyLineDto;
  hive: MoneyLineDto;
  hbd: MoneyLineDto;
  total: MoneyLineDto;
  authorPayout?: MoneyLineDto;
  curatorPayout?: MoneyLineDto;
}

export interface PostRewardDto {
  amount: number;
  currency: SupportedCurrency;
  label: string;
  phase: 'potential' | 'paid';
  breakdown: PostRewardBreakdownDto;
  beneficiaries?: PostRewardBeneficiaryDto[];
  cashoutAt?: string;
  isPayoutDeclined?: boolean;
  payoutLimitHit?: boolean;
  promotionCost?: MoneyLineDto;
  rewardPowerOnly?: boolean;
}

export interface FeedVoteSummaryDto {
  totalCount: number;
  previewVoters: string[];
  /** True when the viewer (see `X-Viewer`) has an active vote on this post. */
  voted: boolean;
}

export interface PostVoterProfileDto {
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PostVoterRowDto {
  voter: string;
  /** Hive vote weight scale (10000 = 100%). */
  percent: number;
  valueUsd: number;
  valueLabel: string;
  profile: PostVoterProfileDto;
}

export interface PostVotersPageDto {
  upvoteCount: number;
  downvoteCount: number;
  items: PostVoterRowDto[];
  nextCursor: string | null;
}

export interface FeedStoryItemDto {
  id: string;
  author: string;
  permlink: string;
  title: string;
  excerpt: string;
  createdAt: string;
  feedAt: string;
  rebloggedBy: string | null;
  /** True when `X-Viewer` appears in `reblogged_users` (Hive) or `post_reblogged_users` (DB). */
  rebloggedByViewer: boolean;
  isNsfw: boolean;
  category: string | null;
  children: number;
  pendingPayout: string;
  totalPayout: string;
  /** Server-computed display reward in requested currency. */
  reward: PostRewardDto | null;
  waivRewardEligible: boolean;
  netRshares: string;
  thumbnailUrl: string | null;
  /** Poster URL when post embeds video (json_metadata.video or video links in body). */
  videoThumbnailUrl: string | null;
  /** Iframe `src` for inline playback when detectable (HTTPS embed URLs). */
  videoEmbedUrl: string | null;
  authorProfile: {
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
    reputation: number;
  };
  objects: ProjectedObject[];
  votes: FeedVoteSummaryDto;
}

export interface UserBlogFeedResponse {
  items: FeedStoryItemDto[];
  cursor: string | null;
  hasMore: boolean;
}

/** Single post by author/permlink; includes full body and all tagged objects (same resolution as feed). */
export interface SinglePostViewDto extends FeedStoryItemDto {
  body: string;
}

/** Discussion comment row: feed card fields plus full Hive `body`. */
export interface DiscussionCommentDto extends FeedStoryItemDto {
  body: string;
}

export interface PostDiscussionResponseDto {
  rootAuthor: string;
  rootPermlink: string;
  rebloggedUsers: string[];
  rebloggedByViewer: boolean;
  rootCommentIds: string[];
  childrenById: Record<string, string[]>;
  comments: Record<string, DiscussionCommentDto>;
}

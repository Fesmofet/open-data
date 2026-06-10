import type { Post } from '@opden-data-layer/core';
import type { ResolvedObjectView } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AggregatedObjectRepository,
  AccountsCurrentRepository,
  PostsRepository,
  type FeedBranchRow,
} from '../../repositories';
import { mapAccountToUserProfileView } from '../users/account-mapper';
import type { UserProfileView } from '../users/user-profile.types';
import { GovernanceResolverService } from '../governance';
import {
  assembleFeedObjectChipsForPost,
  groupPostObjectsByPostKey,
} from './feed-object-summaries';
import { ObjectProjectionService, emptyRankVoteProjection } from '../object-projection';
import { FEED_OBJECT_UPDATE_TYPES, FEED_TAGGED_OBJECT_DISPLAY_LIMIT } from './feed.constants';
import type { SupportedCurrency } from '@opden-data-layer/core';

import { buildPostRewardInputFromPostRow } from './build-post-reward-input';
import type { FeedStoryItemDto } from './feed-story-dtos';
import type { PostRewardService } from './post-reward.service';
import { stripHtmlForExcerpt, truncateExcerpt } from './post-excerpt';
import { extractThumbnailUrl } from './post-thumbnail';
import { extractVideoEmbedUrl, extractVideoThumbnailUrl } from './post-video-thumbnail';
import { isNsfwPost } from './post-nsfw';
import { viewerHasReblogged } from './viewer-reblog-state';

export type BuildFeedStoryItemsFromPostPageDeps = {
  postsRepo: PostsRepository;
  accounts: AccountsCurrentRepository;
  aggregatedObjectRepo: AggregatedObjectRepository;
  objectViewService: ObjectViewService;
  governanceResolver: GovernanceResolverService;
  objectProjection: ObjectProjectionService;
  postRewardService: PostRewardService;
};

/**
 * Shared blog-style feed row assembly: posts + post_objects + votes + object chips.
 */
export async function buildFeedStoryItemsFromPostPage(
  deps: BuildFeedStoryItemsFromPostPageDeps,
  pageRows: FeedBranchRow[],
  locale: string,
  governanceObjectIdFromHeader: string | undefined,
  viewerAccount: string | undefined,
  currency: SupportedCurrency,
): Promise<FeedStoryItemDto[]> {
  const {
    postsRepo,
    accounts,
    aggregatedObjectRepo,
    objectViewService,
    governanceResolver,
    objectProjection,
    postRewardService,
  } = deps;

  const keys = pageRows.map((r) => ({ author: r.author, permlink: r.permlink }));
  const viewerTrimmed = viewerAccount?.trim() ?? '';
  const [postRows, postObjects, voteMap, viewerReblogKeys] = await Promise.all([
    postsRepo.findPostsByKeys(keys),
    postsRepo.findPostObjectsByKeys(keys),
    postsRepo.findActiveVoteSummaries(keys, viewerAccount),
    viewerTrimmed !== ''
      ? postsRepo.findViewerRebloggedKeys(keys, viewerTrimmed)
      : Promise.resolve(new Set<string>()),
  ]);

  const postByKey = new Map<string, Post>();
  for (const p of postRows) {
    postByKey.set(`${p.author}\0${p.permlink}`, p);
  }

  const authorNames = [...new Set(pageRows.map((r) => r.author))];
  const accountRows = await accounts.findByNames(authorNames);
  const profileByName = new Map<string, UserProfileView>();
  for (const row of accountRows) {
    profileByName.set(row.name, mapAccountToUserProfileView(row));
  }

  const objectIds = [...new Set(postObjects.map((o) => o.object_id))];
  const governance = await governanceResolver.resolveMergedForObjectView(
    governanceObjectIdFromHeader,
  );

  let viewsByObjectId = new Map<string, ResolvedObjectView>();
  const weightByObjectId = new Map<string, number | null>();
  let rankVoteProjection = emptyRankVoteProjection();
  if (objectIds.length > 0) {
    const { objects, voterWaivPowers, rankVoteProjection: rvp } =
      await aggregatedObjectRepo.loadByObjectIds(objectIds, { viewerAccount });
    rankVoteProjection = rvp;
    for (const o of objects) {
      weightByObjectId.set(o.core.object_id, o.core.weight);
    }
    const views = objectViewService.resolve(objects, voterWaivPowers, {
      update_types: [...FEED_OBJECT_UPDATE_TYPES],
      locale,
      include_rejected: false,
      governance,
    });
    viewsByObjectId = new Map(views.map((v, i) => [objects[i].core.object_id, v]));
  }

  const batchProjectOptions = {
    locale,
    governanceObjectIdFromHeader,
    viewerAccount,
    rankVoteProjection,
    governance,
  };
  const projectedById = new Map(
    objectIds.length > 0
      ? (
          await objectProjection.batchProject(
            [...viewsByObjectId.values()],
            batchProjectOptions,
          )
        ).map((p) => [p.object_id, p] as const)
      : [],
  );
  const postObjectsByKey = groupPostObjectsByPostKey(postObjects);

  const items: FeedStoryItemDto[] = [];
  const rewardInputs: ReturnType<typeof buildPostRewardInputFromPostRow>[] = [];
  for (const row of pageRows) {
    const pk = `${row.author}\0${row.permlink}`;
    const post = postByKey.get(pk);
    if (!post) {
      throw new Error(`Post row missing for feed key ${row.author}/${row.permlink}`);
    }

    const profile = profileByName.get(row.author);
    const authorProfile = profile
      ? {
          name: profile.name,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          reputation: profile.reputation,
        }
      : {
          name: row.author,
          displayName: null,
          avatarUrl: null,
          reputation: 0,
        };

    const excerpt = truncateExcerpt(stripHtmlForExcerpt(post.body ?? ''));
    const votes = voteMap.get(pk) ?? { totalCount: 0, previewVoters: [], voted: false };

    const objectsForPost = postObjectsByKey.get(pk) ?? [];
    const objects = assembleFeedObjectChipsForPost(
      objectsForPost,
      projectedById,
      weightByObjectId,
      FEED_TAGGED_OBJECT_DISPLAY_LIMIT,
    );

    items.push({
      id: `${row.author}/${row.permlink}`,
      author: row.author,
      permlink: row.permlink,
      title: post.title ?? '',
      excerpt,
      createdAt: new Date(post.created_unix * 1000).toISOString(),
      feedAt: new Date(row.feed_at * 1000).toISOString(),
      rebloggedBy: row.reblogged_by,
      rebloggedByViewer: viewerHasReblogged([], viewerAccount, viewerReblogKeys.has(pk)),
      isNsfw: isNsfwPost(post.json_metadata ?? '', post.category),
      category: post.category,
      children: post.children,
      pendingPayout: post.pending_payout_value ?? '',
      totalPayout: post.total_payout_value ?? '',
      reward: null,
      waivRewardEligible: false,
      netRshares: String(post.net_rshares),
      thumbnailUrl: extractThumbnailUrl(post.json_metadata ?? '', post.body ?? ''),
      videoThumbnailUrl: extractVideoThumbnailUrl(post.json_metadata ?? '', post.body ?? ''),
      videoEmbedUrl: extractVideoEmbedUrl(post.json_metadata ?? '', post.body ?? '', {
        author: post.author,
        permlink: post.permlink,
      }),
      authorProfile,
      objects,
      votes: {
        totalCount: votes.totalCount,
        previewVoters: votes.previewVoters,
        voted: votes.voted,
      },
    });
    rewardInputs.push(buildPostRewardInputFromPostRow(post));
  }

  return postRewardService.enrichFeedItems(items, rewardInputs, currency);
}

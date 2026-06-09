import { Injectable } from '@nestjs/common';
import { HiveClient } from '@opden-data-layer/clients';
import type { HiveContentType } from '@opden-data-layer/clients';
import type { SupportedCurrency } from '@opden-data-layer/core';

import { AccountsCurrentRepository, PostsRepository } from '../../repositories';
import { mapAccountToUserProfileView } from '../users/account-mapper';
import { parsePostingMetadata } from '../users/parse-posting-metadata';
import type {
  DiscussionCommentDto,
  FeedStoryItemDto,
  PostDiscussionResponseDto,
} from './feed-story-dtos';
import { mapHiveContentToDiscussionCommentDto } from './map-hive-content-to-discussion-comment.dto';
import {
  buildPostDiscussionTree,
  postDiscussionKey,
  rebloggedUsersFromHiveContent,
} from './build-post-discussion-tree';
import { enrichDiscussionCommentsRewards } from './enrich-discussion-comments-rewards';
import { PostRewardService } from './post-reward.service';
import { viewerHasReblogged } from './viewer-reblog-state';

@Injectable()
export class GetPostDiscussionEndpoint {
  constructor(
    private readonly hiveClient: HiveClient,
    private readonly accounts: AccountsCurrentRepository,
    private readonly postsRepo: PostsRepository,
    private readonly postRewardService: PostRewardService,
  ) {}

  async execute(
    author: string,
    permlink: string,
    viewerAccount?: string,
    currency: SupportedCurrency = 'USD',
  ): Promise<PostDiscussionResponseDto | null> {
    const state = await this.hiveClient.getState(author, permlink);
    const content = state.content ?? {};
    const rootKey = postDiscussionKey(author, permlink);
    const rootNode =
      content[rootKey] ??
      Object.values(content).find(
        (c) => postDiscussionKey(c.author, c.permlink) === rootKey,
      );

    if (!rootNode?.author?.trim()) {
      return null;
    }

    const rebloggedUsers = rebloggedUsersFromHiveContent(rootNode);
    const rebloggedKeys = await this.postsRepo.findViewerRebloggedKeys(
      [{ author, permlink }],
      viewerAccount ?? '',
    );
    const rebloggedInDb = rebloggedKeys.has(`${author}\0${permlink}`);
    const rebloggedByViewer = viewerHasReblogged(
      rebloggedUsers,
      viewerAccount,
      rebloggedInDb,
    );

    const tree = buildPostDiscussionTree(content, author, permlink);
    const authorNames = new Set<string>();
    for (const id of tree.commentKeys) {
      const node = this.findNodeById(content, id);
      if (node?.author?.trim()) {
        authorNames.add(node.author.trim());
      }
    }

    const accountRows = await this.accounts.findByNames([...authorNames]);
    const profileByName = new Map<string, FeedStoryItemDto['authorProfile']>(
      accountRows.map((row) => {
        const profile = mapAccountToUserProfileView(row);
        return [
          row.name,
          {
            name: profile.name,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            reputation: profile.reputation,
          },
        ];
      }),
    );

    const missingAuthors = [...authorNames].filter((name) => !profileByName.has(name));
    if (missingAuthors.length > 0) {
      const hiveAccounts = await this.hiveClient.getAccounts(missingAuthors);
      for (const ha of hiveAccounts) {
        if (!ha?.name?.trim()) {
          continue;
        }
        const meta = parsePostingMetadata(ha.posting_json_metadata);
        const metaName = meta?.profile.name?.trim() ?? '';
        const displayName = metaName !== '' ? metaName : ha.name;
        const avatarFromMeta = meta?.profile.profile_image?.trim() ?? '';
        const avatarUrl = avatarFromMeta !== '' ? avatarFromMeta : null;
        profileByName.set(ha.name, {
          name: ha.name,
          displayName,
          avatarUrl,
          reputation: 0,
        });
      }
    }

    const comments: Record<string, DiscussionCommentDto> = {};
    for (const id of tree.commentKeys) {
      const node = this.findNodeById(content, id);
      if (!node) {
        continue;
      }
      const authorProfile: FeedStoryItemDto['authorProfile'] = profileByName.get(
        node.author,
      ) ?? {
        name: node.author,
        displayName: null,
        avatarUrl: null,
        reputation: Number(node.author_reputation ?? 0),
      };
      comments[id] = mapHiveContentToDiscussionCommentDto(
        node,
        authorProfile,
        viewerAccount,
      );
    }

    const commentKeys = tree.commentKeys.map((id) => {
      const node = this.findNodeById(content, id);
      return node
        ? { author: node.author, permlink: node.permlink }
        : null;
    }).filter((k): k is { author: string; permlink: string } => k != null);
    const postRows = await this.postsRepo.findPostsByKeys(commentKeys);

    const enrichedComments = await enrichDiscussionCommentsRewards(
      this.postRewardService,
      comments,
      content,
      postRows,
      currency,
      (id) => this.findNodeById(content, id),
    );

    return {
      rootAuthor: author,
      rootPermlink: permlink,
      rebloggedUsers,
      rebloggedByViewer,
      rootCommentIds: tree.rootCommentIds,
      childrenById: tree.childrenById,
      comments: enrichedComments,
    };
  }

  private findNodeById(
    content: Record<string, HiveContentType>,
    id: string,
  ): HiveContentType | undefined {
    const direct = content[id];
    if (direct) {
      return direct;
    }
    return Object.values(content).find(
      (c) => postDiscussionKey(c.author, c.permlink) === id,
    );
  }
}

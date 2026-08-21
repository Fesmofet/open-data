import { Injectable, Logger } from '@nestjs/common';
import { PostsRepository } from '../../repositories/posts.repository';
import { PostRepliesRepository } from '../../repositories/post-replies.repository';
import { ThreadsRepository } from '../../repositories/threads.repository';
import {
  blockTimestampToUnixSeconds,
  isThreadParentAccount,
  isTruthyMetadata,
  parseJsonMetadata,
} from '@opden-data-layer/core';
import {
  commentOperationPayloadSchema,
  deleteCommentOperationPayloadSchema,
} from './hive-comment.schema';
import { CommentPostObjectBindService } from './comment-post-object-bind.service';
import { PostUpsertService } from './post-upsert.service';
import { ThreadParseService } from './thread-parse.service';
import { HiveCommentNotificationService } from './hive-comment-notification.service';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';

@Injectable()
export class CommentOperationOrchestrator {
  private readonly logger = new Logger(CommentOperationOrchestrator.name);

  constructor(
    private readonly postUpsert: PostUpsertService,
    private readonly threadParse: ThreadParseService,
    private readonly postsRepository: PostsRepository,
    private readonly postRepliesRepository: PostRepliesRepository,
    private readonly threadsRepository: ThreadsRepository,
    private readonly commentPostObjectBind: CommentPostObjectBindService,
    private readonly commentNotifications: HiveCommentNotificationService,
  ) {}

  async handleComment(
    payload: unknown,
    context: HiveOperationHandlerContext,
  ): Promise<void> {
    const blockTimestamp = context.timestamp;
    const parsed = commentOperationPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid comment payload: ${parsed.error.message}`);
      return;
    }
    const op = parsed.data;
    const metadata = parseJsonMetadata(op.json_metadata);

    if (op.parent_author === '' && isTruthyMetadata(metadata)) {
      await this.postUpsert.upsertRootPost(op, metadata, blockTimestamp);
    }

    if (op.parent_author && op.parent_permlink) {
      const isThreadRoot = isThreadParentAccount(op.parent_author);
      if (isThreadRoot) {
        await this.threadParse.parseThread(op, {
          blockTimestamp,
        });
      } else {
        await this.threadParse.parseThreadReply(op, blockTimestamp);
      }
      await this.postsRepository.incrementChildren(
        op.parent_author,
        op.parent_permlink,
      );
      if (!isThreadRoot) {
        const root = await this.postRepliesRepository.resolveRoot(
          op.parent_author,
          op.parent_permlink,
        );
        if (root) {
          await this.postRepliesRepository.upsertReply({
            author: op.author,
            permlink: op.permlink,
            root_author: root.root_author,
            root_permlink: root.root_permlink,
            parent_author: op.parent_author,
            parent_permlink: op.parent_permlink,
            created_unix: blockTimestampToUnixSeconds(blockTimestamp),
          });
        } else {
          this.logger.warn(
            `Could not resolve post reply root for parent ${op.parent_author}/${op.parent_permlink}`,
          );
        }
      }
      await this.commentPostObjectBind.tryBindObjectsFromComment(op, blockTimestamp);
    }

    await this.commentNotifications.emitForComment(op, context);
  }

  /**
   * @returns true when post was deleted from DB (campaign queue step skipped → differs from legacy).
   */
  async handleDeleteComment(payload: unknown): Promise<boolean> {
    const raw = payload as Record<string, unknown> | null | undefined;
    const author = typeof raw?.author === 'string' ? raw.author : '';
    const permlink = typeof raw?.permlink === 'string' ? raw.permlink : '';

    await this.threadsRepository.softDelete(author, permlink);

    const parsed = deleteCommentOperationPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return false;
    }

    const deleted = await this.postsRepository.deleteOne(
      parsed.data.author,
      parsed.data.permlink,
    );
    return deleted !== undefined;
  }
}

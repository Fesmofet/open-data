import { Injectable } from '@nestjs/common';
import { extractMentions } from '@opden-data-layer/core';
import { PostsRepository } from '../../repositories/posts.repository';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';
import type { CommentOperationPayload } from './hive-comment.schema';

@Injectable()
export class HiveCommentNotificationService {
  constructor(
    private readonly notificationEmitter: NotificationEmitterService,
    private readonly postsRepository: PostsRepository,
  ) {}

  async emitForComment(
    op: CommentOperationPayload,
    ctx: HiveOperationHandlerContext,
  ): Promise<void> {
    const emitCtx = this.notificationEmitter.hiveContext(ctx);
    const isRoot = op.parent_author === '';
    const isReplyToComment = await this.resolveIsReplyToComment(op);

    if (isRoot && op.author) {
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'my_post',
        objectId: null,
        actor: op.author,
        payload: {
          author: op.author,
          permlink: op.permlink,
          title: op.title ?? op.permlink,
        },
      });
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'bell_post',
        objectId: null,
        actor: op.author,
        payload: {
          author: op.author,
          permlink: op.permlink,
          title: op.title ?? op.permlink,
        },
      });
    } else if (!isRoot && op.author && op.parent_author) {
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'my_comment',
        objectId: null,
        actor: op.author,
        payload: {
          author: op.author,
          permlink: op.permlink,
          parentAuthor: op.parent_author,
        },
      });

      if (op.parent_author !== op.author) {
        this.notificationEmitter.emitWithContext(emitCtx, {
          type: 'reply',
          objectId: null,
          actor: op.author,
          payload: {
            author: op.author,
            permlink: op.permlink,
            parentAuthor: op.parent_author,
            parentPermlink: op.parent_permlink,
            isRootPost: false,
            replyToPermlink: op.parent_permlink,
            isReplyToComment,
          },
        });
      }
    }

    const body = op.body ?? '';
    const mentions = [...new Set(extractMentions(body))];
    for (const mention of mentions) {
      if (mention === op.author) {
        continue;
      }
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'mention',
        objectId: null,
        actor: op.author,
        payload: {
          author: op.author,
          permlink: op.permlink,
          isRootPost: isRoot,
          mentioned: mention,
        },
      });
    }
  }

  private async resolveIsReplyToComment(
    op: CommentOperationPayload,
  ): Promise<boolean> {
    if (!op.parent_author || !op.parent_permlink) {
      return false;
    }
    const parent = await this.postsRepository.findByKey(
      op.parent_author,
      op.parent_permlink,
    );
    if (parent === undefined) {
      return true;
    }
    return (parent.parent_author ?? '') !== '';
  }
}

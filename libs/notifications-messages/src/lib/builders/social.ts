import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import {
  GENERIC_NOTIFICATION_KEY,
  type NotificationMessage,
  withParamHrefs,
} from '../message';
import { postPath, userProfilePath } from '../links';

export function buildSocialMessage(
  event: AnyNotificationEvent,
): NotificationMessage | null {
  switch (event.type) {
    case 'reply': {
      const p = event.payload;
      const key = p.isReplyToComment
        ? 'notification_reply_username_comment'
        : 'notification_reply_username_post';
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key,
          params: { username: p.author },
          href: postHref,
          icon: 'reply',
          actor: p.author,
        },
        { username: userProfilePath(p.author) },
      );
    }
    case 'mention': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: p.isRootPost
            ? 'notification_mention_username_post'
            : 'notification_mention_username_comment',
          params: { username: p.author },
          href: postHref,
          icon: 'reply',
          actor: p.author,
        },
        { username: userProfilePath(p.author) },
      );
    }
    case 'my_post': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      const postLabel = p.title ?? p.permlink;
      return withParamHrefs(
        {
          key: 'my_post_notify',
          params: { post: postLabel },
          href: postHref,
          icon: 'reply',
          actor: p.author,
        },
        { post: postHref },
      );
    }
    case 'my_comment': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'my_comment_notify',
          params: { parentAuthor: p.parentAuthor },
          href: postHref,
          icon: 'reply',
          actor: p.author,
        },
        { parentAuthor: userProfilePath(p.parentAuthor) },
      );
    }
    case 'vote_like': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'notification_upvoted_username_post',
          params: { username: p.voter },
          href: postHref,
          icon: 'vote',
          actor: p.voter,
        },
        { username: userProfilePath(p.voter) },
      );
    }
    case 'vote_downvote': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'notification_downvoted_username_post',
          params: { username: p.voter },
          href: postHref,
          icon: 'vote',
          actor: p.voter,
        },
        { username: userProfilePath(p.voter) },
      );
    }
    case 'my_vote': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      const postLabel = p.title ?? p.permlink;
      return withParamHrefs(
        {
          key: 'my_like_notify',
          params: { post: postLabel },
          href: postHref,
          icon: 'vote',
          actor: p.voter,
        },
        { post: postHref },
      );
    }
    case 'reblog': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'notification_reblogged_username_post',
          params: { username: p.account },
          href: postHref,
          icon: 'follow',
          actor: p.account,
        },
        { username: userProfilePath(p.account) },
      );
    }
    case 'follow': {
      const p = event.payload;
      if (p.action !== 'follow') {
        const actor = event.actor ?? p.following;
        return withParamHrefs(
          {
            key: GENERIC_NOTIFICATION_KEY,
            params: {},
            href: userProfilePath(actor),
            icon: 'follow',
            actor: event.actor,
          },
          {},
        );
      }
      const actor = event.actor ?? '?';
      return withParamHrefs(
        {
          key: 'notification_following_username',
          params: { username: actor },
          href: event.actor ? userProfilePath(event.actor) : null,
          icon: 'follow',
          actor: event.actor,
        },
        event.actor ? { username: userProfilePath(event.actor) } : {},
      );
    }
    default:
      return null;
  }
}

import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { type NotificationMessage, withParamHrefs } from '../message';
import { objectPath, postPath, userProfilePath } from '../links';

export function buildBellMessage(
  event: AnyNotificationEvent,
): NotificationMessage | null {
  switch (event.type) {
    case 'bell_post': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'notification_bell_post',
          params: { username: p.author, title: p.title },
          href: postHref,
          icon: 'bell',
          actor: p.author,
        },
        {
          username: userProfilePath(p.author),
          title: postHref,
        },
      );
    }
    case 'bell_reblog': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'notification_bell_reblog',
          params: {
            account: p.account,
            author: p.author,
            title: p.title ?? '',
          },
          href: postHref,
          icon: 'bell',
          actor: p.account,
        },
        {
          account: userProfilePath(p.account),
          author: userProfilePath(p.author),
          title: postHref,
        },
      );
    }
    case 'bell_follow': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'notification_bell_follow',
          params: { follower: p.follower, following: p.following },
          href: userProfilePath(p.follower),
          icon: 'bell',
          actor: p.follower,
        },
        {
          follower: userProfilePath(p.follower),
          following: userProfilePath(p.following),
        },
      );
    }
    case 'bell_object_post': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      const objectHref = objectPath(p.wobjectPermlink);
      return withParamHrefs(
        {
          key: 'notification_bell_object_post',
          params: { author: p.author, wobjectName: p.wobjectName },
          href: postHref,
          icon: 'bell',
          actor: p.author,
        },
        {
          author: userProfilePath(p.author),
          wobjectName: objectHref,
        },
      );
    }
    case 'bell_thread': {
      const p = event.payload;
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'notification_object_bell_thread',
          params: { author: p.author, objectName: p.authorPermlink },
          href: postHref,
          icon: 'bell',
          actor: p.author,
        },
        {
          author: userProfilePath(p.author),
          objectName: objectPath(p.authorPermlink),
        },
      );
    }
    case 'thread_author_follower': {
      const p = event.payload;
      const names = [...p.hashtags, ...p.mentions].join(', ');
      const postHref = postPath(p.author, p.permlink);
      return withParamHrefs(
        {
          key: 'notification_thread_author_follower',
          params: { author: p.author, names: names || p.author },
          href: postHref,
          icon: 'bell',
          actor: p.author,
        },
        { author: userProfilePath(p.author) },
      );
    }
    default:
      return null;
  }
}

import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { type NotificationMessage, withParamHrefs } from '../message';
import { objectPath, objectUpdatePath, userProfilePath } from '../links';

function objectHref(
  event: AnyNotificationEvent,
  authorPermlink: string | null,
): string | null {
  if (event.objectId) {
    return objectPath(event.objectId);
  }
  if (authorPermlink) {
    return objectPath(authorPermlink);
  }
  return null;
}

function objectParamHrefs(
  user: string,
  href: string | null,
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  const trimmedUser = user.trim();
  if (trimmedUser.length > 0) {
    out['user'] = userProfilePath(trimmedUser);
  }
  if (href) {
    out['objectName'] = href;
  }
  return out;
}

export function buildObjectMessage(
  event: AnyNotificationEvent,
): NotificationMessage | null {
  switch (event.type) {
    case 'object_update': {
      const p = event.payload;
      const isGroupId =
        p.updateType === 'groupId' || p.updateType === 'group_id';
      const key = isGroupId
        ? 'notification_group_id_update'
        : 'notification_object_update';
      const href = objectHref(event, p.authorPermlink);
      const objectName = p.objectName ?? p.authorPermlink ?? '';
      const user = event.actor ?? '';
      return withParamHrefs(
        {
          key,
          params: {
            user,
            update: p.updateType,
            objectName,
          },
          href,
          icon: 'object',
          actor: event.actor,
        },
        objectParamHrefs(user, href),
      );
    }
    case 'object_created': {
      const p = event.payload;
      const href = objectHref(event, null);
      const user = event.actor ?? '';
      const objectName = event.objectId ?? '';
      return withParamHrefs(
        {
          key: 'notification_object_update',
          params: {
            user,
            update: p.updateType,
            objectName,
          },
          href,
          icon: 'object',
          actor: event.actor,
        },
        objectParamHrefs(user, href),
      );
    }
    case 'object_update_reject': {
      const p = event.payload;
      const isGroupId =
        p.updateType === 'groupId' || p.updateType === 'group_id';
      const key = isGroupId
        ? 'notification_group_id_update_reject'
        : 'notification_object_update_reject';
      const href = objectHref(event, p.authorPermlink);
      const objectName = p.objectName ?? p.authorPermlink ?? '';
      return withParamHrefs(
        {
          key,
          params: {
            user: p.voter,
            update: p.updateType,
            objectName,
          },
          href,
          icon: 'object',
          actor: p.voter,
        },
        objectParamHrefs(p.voter, href),
      );
    }
    case 'object_status_change': {
      const p = event.payload;
      const href = objectHref(event, p.authorPermlink);
      const objectName = p.objectName ?? p.authorPermlink;
      return withParamHrefs(
        {
          key: 'notification_object_update',
          params: {
            user: p.account,
            update: 'status',
            objectName,
          },
          href,
          icon: 'object',
          actor: p.account,
        },
        objectParamHrefs(p.account, href),
      );
    }
    case 'update_vote_cast': {
      const p = event.payload;
      const updateType = p.updateType?.trim() || 'update';
      const objectName = p.objectName ?? p.authorPermlink ?? event.objectId ?? '';
      const user = event.actor ?? '?';
      const href =
        event.objectId && p.updateId
          ? objectUpdatePath(event.objectId, p.updateId)
          : event.objectId
            ? objectPath(event.objectId)
            : null;
      const objectPageHref = event.objectId ? objectPath(event.objectId) : href;
      return withParamHrefs(
        {
          key: 'notification_update_vote_cast',
          params: {
            user,
            update: updateType,
            objectName,
          },
          href,
          icon: 'object',
          actor: event.actor,
        },
        {
          user: userProfilePath(user),
          ...(objectPageHref ? { objectName: objectPageHref } : {}),
        },
      );
    }
    default:
      return null;
  }
}

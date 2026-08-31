'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { userProfilePath } from '@opden-data-layer/notifications-messages';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { Icon } from '@/icons';
import { UserAvatar } from '@/shared/presentation';
import { formatRelativeFeedTime } from '@/shared/utils/format-relative-time';

import {
  applyNotificationParams,
  formatNotification,
  notificationIconType,
  resolveNotificationHref,
} from '../../domain/format-notification';
import { NOTIFICATION_ICON_BY_TYPE } from '../../domain/notification-icon-map';
import type { UserNotificationItem } from '../../infrastructure/notifications-ws-client';
import { NotificationMessageText } from './notification-message-text';

function NotificationTypeIcon({ item }: { item: UserNotificationItem }) {
  const iconType = notificationIconType(item);
  const name = NOTIFICATION_ICON_BY_TYPE[iconType];
  return (
    <Icon name={name} size={18} className="shrink-0 text-fg-secondary" />
  );
}

const AVATAR_SIZE = 36;

export type NotificationRowProps = {
  item: UserNotificationItem;
  viewerUsername?: string;
  /** Called when the context overlay is clicked (e.g. close bell dropdown). */
  onNavigate?: () => void;
};

export function NotificationRow({
  item,
  viewerUsername,
  onNavigate,
}: NotificationRowProps) {
  const { t, locale } = useI18n();
  const formatted = formatNotification(item);
  const contextHref = resolveNotificationHref(item, formatted, viewerUsername);
  const template = t(formatted.key);
  const messageLabel = applyNotificationParams(template, formatted.params);
  const timeLabel = formatRelativeFeedTime(item.occurredAt, locale);
  const actor = formatted.actor?.trim();
  const rowClassName = `relative flex gap-3 px-3 py-2.5${
    contextHref ? ' hover:bg-bg-muted' : ''
  }`;

  function handleOverlayClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey) {
      return;
    }
    onNavigate?.();
  }

  return (
    <div className={rowClassName}>
      {contextHref ? (
        <Link
          href={contextHref}
          className="absolute inset-0 z-[5] cursor-pointer rounded-btn"
          aria-label={messageLabel}
          onClick={handleOverlayClick}
          suppressHydrationWarning
        >
          <span className="sr-only">{messageLabel}</span>
        </Link>
      ) : null}

      <div className="relative z-10 flex min-w-0 flex-1 gap-3 pointer-events-none">
        {actor ? (
          <Link
            href={userProfilePath(actor)}
            className="pointer-events-auto relative z-10 shrink-0"
            suppressHydrationWarning
          >
            <UserAvatar username={actor} size={AVATAR_SIZE} displayName={actor} />
          </Link>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center">
            <NotificationTypeIcon item={item} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <NotificationMessageText
            template={template}
            params={formatted.params}
            paramHrefs={formatted.paramHrefs}
          />
          <p className="mt-0.5 text-nano text-fg-muted">{timeLabel}</p>
        </div>
      </div>
    </div>
  );
}

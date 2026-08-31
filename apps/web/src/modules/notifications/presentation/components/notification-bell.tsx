'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { BellIcon } from '@/icons';

import { useNotificationFeed } from '../../application/use-notification-feed';
import { NotificationRow } from './notification-row';

export type NotificationBellProps = {
  username: string;
  triggerClassName?: string;
  iconSize?: number;
};

export function NotificationBell({
  username,
  triggerClassName,
  iconSize = 22,
}: NotificationBellProps) {
  const { t } = useI18n();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { items, unreadCount, isLoading, markRead } = useNotificationFeed(username);

  useEffect(() => {
    if (!open) {
      return;
    }
    markRead();
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, markRead]);

  const preview = items.slice(0, 5);
  const hasUnread = unreadCount > 0;
  const badgeLabel =
    unreadCount > 99 ? '99+' : hasUnread ? String(unreadCount) : null;
  const triggerAriaLabel =
    badgeLabel !== null
      ? `${t('notifications')} (${badgeLabel})`
      : t('notifications');

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={
          hasUnread
            ? 'notification-header-unread-trigger'
            : (triggerClassName ??
              'relative rounded-btn p-2 text-fg-secondary hover:bg-ghost-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus')
        }
      >
        {hasUnread ? (
          <span className="notification-header-unread-badge" aria-hidden>
            {badgeLabel}
          </span>
        ) : (
          <BellIcon size={iconSize} className="block shrink-0" />
        )}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('notifications')}
          className="absolute end-0 top-full z-[60] mt-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-border bg-surface shadow-card"
        >
          <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
            {isLoading ? (
              <p className="px-3 py-4 text-body-sm text-fg-muted">…</p>
            ) : preview.length > 0 ? (
              preview.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  viewerUsername={username}
                  onNavigate={() => setOpen(false)}
                />
              ))
            ) : (
              <p className="px-3 py-4 text-body-sm text-fg-muted">
                {t('notifications_empty_message')}
              </p>
            )}
          </div>
          <div className="border-t border-border px-3 py-2">
            <Link
              href="/notifications"
              className="text-body-sm font-weight-label text-accent hover:underline"
              onClick={() => setOpen(false)}
            >
              {t('see_all')}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

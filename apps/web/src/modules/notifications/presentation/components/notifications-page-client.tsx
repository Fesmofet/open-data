'use client';

import { useEffect } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { useNotificationFeed } from '../../application/use-notification-feed';
import { NotificationRow } from './notification-row';
import { NotificationsPageIntro } from './notifications-page-intro';

export type NotificationsPageClientProps = {
  username: string;
  telegramBotUsername: string;
  telegramBotUrl: string;
};

function NotificationRowSkeleton() {
  return (
    <div className="flex gap-3 px-3 py-3 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-circle bg-surface-control" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-full max-w-md rounded bg-surface-control" />
        <div className="h-3 w-16 rounded bg-surface-control" />
      </div>
    </div>
  );
}

export function NotificationsPageClient({
  username,
  telegramBotUsername,
  telegramBotUrl,
}: NotificationsPageClientProps) {
  const { t } = useI18n();
  const { items, isLoading, markRead } = useNotificationFeed(username);

  useEffect(() => {
    markRead();
  }, [markRead]);

  return (
    <main className="mx-auto w-full max-w-container-content px-gutter pt-section-y pb-section-y sm:px-gutter-sm">
      <NotificationsPageIntro
        telegramBotUsername={telegramBotUsername}
        telegramBotUrl={telegramBotUrl}
      />

      {isLoading ? (
        <div className="rounded-card border border-border bg-surface">
          {Array.from({ length: 5 }, (_, i) => (
            <NotificationRowSkeleton key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="divide-y divide-border rounded-card border border-border bg-surface">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} viewerUsername={username} />
          ))}
        </div>
      ) : (
        <p className="text-body text-fg-muted">{t('notifications_empty_message')}</p>
      )}
    </main>
  );
}

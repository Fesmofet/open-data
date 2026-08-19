'use client';

import { useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { OptimisticNavLink } from '@/shared/presentation/navigation';

import {
  groupMessagesByDay,
  isOutgoingMessage,
  messageDisplayBody,
} from '../domain/messaging.helpers';
import type { MessageItem } from '../domain/messaging.types';

export type MessagingMessageListProps = {
  messages: MessageItem[];
  viewerUsername: string | null;
  showAuthorNames?: boolean;
  topSentinelRef?: React.RefObject<HTMLDivElement | null>;
  loadingOlder?: boolean;
};

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessagingMessageList({
  messages,
  viewerUsername,
  showAuthorNames = false,
  topSentinelRef,
  loadingOlder = false,
}: MessagingMessageListProps) {
  const { t, locale } = useI18n();

  const chronological = useMemo(
    () => [...messages].sort((a, b) => a.created_at_unix - b.created_at_unix),
    [messages],
  );

  const groups = useMemo(
    () =>
      groupMessagesByDay(chronological, (unix) =>
        new Date(unix * 1000).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      ),
    [chronological, locale],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3">
      {topSentinelRef ? <div ref={topSentinelRef} aria-hidden className="h-px w-full" /> : null}
      {loadingOlder ? (
        <p className="py-2 text-center text-caption text-muted">{t('messaging_loading_older')}</p>
      ) : null}
      {groups.map((group) => (
        <div key={group.dayKey} className="mb-4">
          <div className="mb-3 flex justify-center">
            <span className="rounded-full bg-surface-control px-3 py-1 text-caption text-muted">
              {group.label}
            </span>
          </div>
          <div className="space-y-2">
            {group.messages.map((message) => {
              const outgoing = isOutgoingMessage(message, viewerUsername);
              const body = messageDisplayBody(message);
              return (
                <div
                  key={message.message_id}
                  className={outgoing ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={[
                      'max-w-[min(100%,28rem)] rounded-card px-3 py-2',
                      outgoing
                        ? 'bg-accent-soft text-fg'
                        : 'border border-border bg-surface text-fg',
                    ].join(' ')}
                  >
                    {!outgoing && showAuthorNames ? (
                      <p className="mb-1 text-caption font-weight-label">
                        <OptimisticNavLink
                          href={`/@${encodeURIComponent(message.author)}`}
                          className="text-accent hover:underline"
                        >
                          {message.author}
                        </OptimisticNavLink>
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words text-body-sm">{body}</p>
                    <p className="mt-1 text-caption text-muted">
                      {formatTime(message.created_at_unix)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

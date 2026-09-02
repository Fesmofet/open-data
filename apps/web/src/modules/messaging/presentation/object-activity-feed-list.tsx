'use client';

import { useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { sanitizePostBodyHtml } from '@/shared/infrastructure/post-body-html-pipeline';
import { OptimisticNavLink } from '@/shared/presentation/navigation';

import {
  groupMessagesByDay,
  isOutgoingMessage,
  resolveMessagePresentation,
  formatActivityMessageCaption,
} from '../domain/messaging.helpers';
import type { MessageItem } from '../domain/messaging.types';

export type ObjectActivityFeedListProps = {
  messages: MessageItem[];
  viewerUsername: string | null;
  loadingMore?: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
};

function formatTime(unix: number, locale: string): string {
  return new Date(unix * 1000).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ObjectActivityFeedList({
  messages,
  viewerUsername,
  loadingMore = false,
  sentinelRef,
}: ObjectActivityFeedListProps) {
  const { t, locale } = useI18n();

  const groups = useMemo(
    () =>
      groupMessagesByDay(messages, (unix) =>
        new Date(unix * 1000).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      ),
    [locale, messages],
  );

  if (messages.length === 0) {
    return (
      <p className="py-6 text-center text-body-sm text-muted">
        {t('object_activity_empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.dayKey}>
          <div className="mb-3 flex justify-center">
            <span className="rounded-full bg-surface-control px-3 py-1 text-caption text-muted">
              {group.label}
            </span>
          </div>
          <div className="space-y-3">
            {group.messages.map((message) => {
              const outgoing = isOutgoingMessage(message, viewerUsername);
              const presentation = resolveMessagePresentation(message, viewerUsername);
              const bubbleClass = [
                'max-w-[min(100%,28rem)] rounded-card px-3 py-2',
                outgoing
                  ? 'bg-accent-soft text-fg'
                  : 'border border-border bg-surface text-fg',
              ].join(' ');

              let bodyNode: React.ReactNode;
              if (presentation.kind === 'plain') {
                bodyNode = (
                  <div
                    className="blog-post-body break-words text-body-sm [&_a]:text-link [&_a]:underline"
                    dangerouslySetInnerHTML={{
                      __html: sanitizePostBodyHtml(presentation.text),
                    }}
                  />
                );
              } else if (presentation.kind === 'decrypted') {
                bodyNode = (
                  <div
                    className="blog-post-body break-words text-body-sm [&_a]:text-link [&_a]:underline"
                    dangerouslySetInnerHTML={{
                      __html: sanitizePostBodyHtml(presentation.text),
                    }}
                  />
                );
              } else {
                bodyNode = (
                  <p className="text-body-sm text-muted">
                    {t('object_activity_encrypted_unsupported')}
                  </p>
                );
              }

              return (
                <div
                  key={message.message_id}
                  className={outgoing ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div className={bubbleClass}>
                    {!outgoing ? (
                      <p className="mb-1 text-caption font-weight-label">
                        <OptimisticNavLink
                          href={`/@${encodeURIComponent(message.author)}`}
                          className="text-accent hover:underline"
                        >
                          {message.author}
                        </OptimisticNavLink>
                      </p>
                    ) : null}
                    {bodyNode}
                    <p className="mt-1 text-caption text-muted">
                      {message.original_created_at_unix != null
                        ? formatActivityMessageCaption(
                            message,
                            locale,
                            t('object_activity_original_date_caption'),
                          )
                        : formatTime(message.created_at_unix, locale)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {loadingMore ? (
        <p className="py-2 text-center text-caption text-muted">
          {t('messaging_loading_older')}
        </p>
      ) : null}
      <div ref={sentinelRef} aria-hidden className="h-px" />
    </div>
  );
}

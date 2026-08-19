'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserAvatar } from '@/shared/presentation';

import {
  hiveAvatarUrl,
  resolveChannelImageUrl,
} from '../domain/messaging.helpers';
import type { ChannelDetail } from '../domain/messaging.types';

export type MessagingChannelAboutProps = {
  channel: ChannelDetail;
  description?: string | null;
  /** `rail` — profile third column; `embedded` — inside messenger shell. */
  variant?: 'rail' | 'embedded';
};

export function MessagingChannelAbout({
  channel,
  description = null,
  variant = 'embedded',
}: MessagingChannelAboutProps) {
  const { t } = useI18n();
  const title = channel.display_title ?? channel.title ?? channel.channel_id;
  const imageUrl = resolveChannelImageUrl(channel.image);

  return (
    <aside
      className={[
        'flex h-full min-h-0 flex-col overflow-y-auto bg-bg p-4',
        variant === 'embedded' ? 'border-l border-border' : '',
      ].join(' ')}
    >
      <h2 className="text-body-lg font-weight-strong text-fg">{t('messaging_about')}</h2>
      <div className="mt-4 flex flex-col items-center text-center">
        {channel.kind === 'direct' && channel.peer ? (
          <UserAvatar
            username={channel.peer}
            avatarUrl={hiveAvatarUrl(channel.peer)}
            displayName={channel.peer}
            size={72}
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="size-[4.5rem] rounded-full object-cover"
          />
        ) : (
          <div className="flex size-[4.5rem] items-center justify-center rounded-full bg-surface-control text-heading-sm font-weight-strong text-fg-secondary">
            {title.trim().charAt(0).toUpperCase() || '#'}
          </div>
        )}
        <p className="mt-3 font-weight-strong text-fg">{title}</p>
        {description ? (
          <p className="mt-2 text-body-sm text-muted">{description}</p>
        ) : null}
        <p className="mt-1 text-caption text-muted">
          {t('messaging_members_count').replace('{count}', String(channel.members.length))}
        </p>
      </div>
      <div className="mt-6">
        <h3 className="text-body-sm font-weight-label text-fg">{t('messaging_members')}</h3>
        <ul className="mt-2 space-y-2">
          {channel.members.slice(0, 8).map((member) => (
            <li key={member}>
              <Link
                href={`/@${member}`}
                className="flex items-center gap-2 rounded-btn px-1 py-1 hover:bg-surface-control/60"
              >
                <UserAvatar
                  username={member}
                  avatarUrl={hiveAvatarUrl(member)}
                  displayName={member}
                  size={32}
                />
                <span className="truncate text-body-sm text-fg">{member}</span>
              </Link>
            </li>
          ))}
        </ul>
        {channel.members.length > 8 ? (
          <p className="mt-2 text-caption text-muted">
            {t('messaging_members_more').replace('{count}', String(channel.members.length - 8))}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

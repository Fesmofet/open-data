'use client';

import { useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { profileSectionTabClass } from '@/shared/presentation';
import {
  HORIZONTAL_TAB_NAV_SUB_ROW_CLASS,
  horizontalTabNavScrollShellClass,
} from '@/shared/presentation/layout';

import {
  filterChannelsByFollowing,
  filterChannelsBySearch,
} from '../domain/messaging.helpers';
import type { ChannelListItem, MessagingListFilter } from '../domain/messaging.types';
import {
  MESSAGING_COLUMN_FOOTER_INNER_CLASS,
  MESSAGING_COLUMN_FOOTER_SHELL_CLASS,
} from './messaging-layout.constants';
import { MessagingChannelRow } from './messaging-channel-row';

export type MessagingChannelListProps = {
  channels: ChannelListItem[];
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onNewMessage?: () => void;
  followingSet?: ReadonlySet<string>;
  viewerUsername?: string | null;
  /** `rail` — profile left column; `embedded` — inside center messenger shell. */
  variant?: 'rail' | 'embedded';
};

export function MessagingChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
  onNewMessage,
  followingSet = new Set<string>(),
  viewerUsername = null,
  variant = 'embedded',
}: MessagingChannelListProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<MessagingListFilter>('all');
  const [search, setSearch] = useState('');

  const visibleChannels = useMemo(() => {
    const searched = filterChannelsBySearch(channels, search);
    if (filter === 'following') {
      return filterChannelsByFollowing(searched, followingSet, viewerUsername);
    }
    return searched;
  }, [channels, filter, followingSet, search, viewerUsername]);

  return (
    <div
      className={[
        'flex h-full min-h-0 flex-col bg-bg',
        variant === 'embedded' ? 'border-r border-border' : '',
      ].join(' ')}
    >
      <div className="shrink-0 border-b border-border px-3 py-3">
        <h2 className="text-body-lg font-weight-strong text-fg">{t('messages')}</h2>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('messaging_search_chats')}
          className="mt-3 w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg placeholder:text-muted"
        />
        <div className={horizontalTabNavScrollShellClass('none')}>
          <nav
            aria-label={t('messaging_list_filter_aria')}
            className={HORIZONTAL_TAB_NAV_SUB_ROW_CLASS}
          >
            {(['all', 'following'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={profileSectionTabClass(filter === tab, 'sub')}
                onClick={() => setFilter(tab)}
              >
                {tab === 'all' ? t('messaging_all') : t('messaging_following')}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {visibleChannels.length === 0 ? (
          <p className="px-3 py-6 text-body-sm text-muted">{t('messaging_no_channels')}</p>
        ) : (
          visibleChannels.map((channel) => (
            <MessagingChannelRow
              key={channel.channel_id}
              channel={channel}
              active={activeChannelId === channel.channel_id}
              onSelect={onSelectChannel}
            />
          ))
        )}
      </div>
      {onNewMessage ? (
        <div className={[MESSAGING_COLUMN_FOOTER_SHELL_CLASS, 'mt-auto'].join(' ')}>
          <div className={MESSAGING_COLUMN_FOOTER_INNER_CLASS}>
            <button
              type="button"
              className="w-full rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg"
              onClick={onNewMessage}
            >
              {t('messaging_new_message')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

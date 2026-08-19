'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { ChannelDetail } from '../domain/messaging.types';
import { loadProfileChannelAboutAction } from '../infrastructure/messaging.actions';
import { MESSAGING_CARD_SHELL_CLASS } from './messaging-layout.constants';
import { MessagingChannelAbout } from './messaging-channel-about';
import { MessagingViewportShell } from './messaging-viewport-shell';

export type MessagingProfileAboutRailProps = {
  accountName: string;
  viewerUsername: string | null;
};

export function MessagingProfileAboutRail({
  accountName,
  viewerUsername,
}: MessagingProfileAboutRailProps) {
  const searchParams = useSearchParams();
  const channel = searchParams.get('channel');
  const peer = searchParams.get('peer');
  const [detail, setDetail] = useState<ChannelDetail | null>(null);
  const [pending, setPending] = useState(false);

  const isOwnInbox =
    viewerUsername != null &&
    viewerUsername.toLowerCase() === accountName.toLowerCase();

  useEffect(() => {
    if (!isOwnInbox) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setPending(true);
    void loadProfileChannelAboutAction({ channel, peer })
      .then((next) => {
        if (!cancelled) {
          setDetail(next);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [channel, isOwnInbox, peer]);

  if (!isOwnInbox || (!detail && !pending)) {
    return null;
  }

  if (pending && !detail) {
    return (
      <MessagingViewportShell>
        <aside
          className={[MESSAGING_CARD_SHELL_CLASS, 'p-4'].join(' ')}
          aria-hidden
        >
        <div className="h-6 w-24 animate-pulse rounded-btn bg-surface-control" />
        <div className="mx-auto mt-6 size-[4.5rem] animate-pulse rounded-full bg-surface-control" />
        <div className="mx-auto mt-3 h-4 w-32 animate-pulse rounded-btn bg-surface-control" />
        </aside>
      </MessagingViewportShell>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <MessagingViewportShell>
      <div className={MESSAGING_CARD_SHELL_CLASS}>
        <MessagingChannelAbout channel={detail} variant="rail" />
      </div>
    </MessagingViewportShell>
  );
}

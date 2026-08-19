'use client';

import type { ReactNode } from 'react';

import {
  MESSAGING_CENTER_VIEWPORT_SHELL_CLASS,
  MESSAGING_LAYOUT_CARD_CLASS,
} from './messaging-layout.constants';

export type MessagingLayoutProps = {
  list?: ReactNode;
  chat: ReactNode;
  about?: ReactNode;
  mobileView?: 'list' | 'chat';
  onMobileBack?: () => void;
  /** When true, list is omitted on lg+ (rendered in profile left column). */
  listDesktopHidden?: boolean;
};

export function MessagingLayout({
  list,
  chat,
  about,
  mobileView = 'list',
  onMobileBack,
  listDesktopHidden = false,
}: MessagingLayoutProps) {
  const listVisibleOnMobile = Boolean(list) && mobileView === 'list';
  const chatHiddenOnMobile = Boolean(list) && mobileView === 'list';

  return (
    <div className={MESSAGING_CENTER_VIEWPORT_SHELL_CLASS}>
      <div className={MESSAGING_LAYOUT_CARD_CLASS}>
      {list ? (
        <div
          className={[
            'flex min-h-0 w-full min-w-0 shrink-0 flex-col',
            listDesktopHidden ? 'lg:hidden' : 'lg:block lg:w-[17.5rem]',
            listVisibleOnMobile ? 'block' : 'hidden',
          ].join(' ')}
        >
          {list}
        </div>
      ) : null}
      <div
        className={[
          'flex min-h-0 min-w-0 flex-1 flex-col',
          chatHiddenOnMobile ? 'hidden lg:flex' : 'flex',
        ].join(' ')}
      >
        {onMobileBack && mobileView === 'chat' && listDesktopHidden ? (
          <div className="border-b border-border px-3 py-2 lg:hidden">
            <button
              type="button"
              className="text-body-sm font-weight-label text-accent"
              onClick={onMobileBack}
            >
              ← Back
            </button>
          </div>
        ) : null}
        {chat}
      </div>
      {about ? (
        <div className="hidden min-h-0 min-w-0 shrink-0 xl:block xl:w-[20rem]">{about}</div>
      ) : null}
      </div>
    </div>
  );
}

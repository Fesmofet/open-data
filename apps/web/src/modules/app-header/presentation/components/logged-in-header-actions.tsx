'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ChevronDownIcon, PenLineIcon } from '@/icons';
import { businessRoutes } from '@/modules/business';
import { NotificationBell } from '@/modules/notifications';
import { isToolsHubPath } from '@/modules/tools';
import { clearWalletSession } from '@/modules/auth/infrastructure';
import { UserAvatar } from '@/shared/presentation';

import type { AppHeaderUser } from '../../domain/app-header-user';

/** 32×32 hit target — matches `UserAvatar` size={32} and unread notification badge. */
const HEADER_ICON_BTN_CLASS =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-btn p-0 leading-none text-nav-fg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&_svg]:block';

const HEADER_ICON_SIZE = 20;

export type LoggedInHeaderActionsProps = {
  user: AppHeaderUser;
};

function menuNavLinkClassName(active: boolean): string {
  return [
    'app-header-menu-feed-link',
    active ? 'text-heading font-weight-label' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function LoggedInHeaderActions({ user }: LoggedInHeaderActionsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const feedHref = `/@${encodeURIComponent(user.username)}`;
  const profileAboutHref = `/@${encodeURIComponent(user.username)}/about`;
  const profileMainPath = `/user-profile/${user.username}`;
  const profileAboutPath = `/user-profile/${user.username}/about`;
  const walletHref = `/@${encodeURIComponent(user.username)}/transfers?type=WAIV`;
  const walletPathPrefix = `/@${encodeURIComponent(user.username)}/transfers`;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) {
        return;
      }
      setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  async function onLogout() {
    setLogoutPending(true);
    clearWalletSession();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      setMenuOpen(false);
      router.refresh();
    } finally {
      setLogoutPending(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className="flex shrink-0 items-center gap-1 sm:gap-2"
    >
      <Link
        href="/editor"
        title={t('write_post')}
        aria-label={t('write_post')}
        className={HEADER_ICON_BTN_CLASS}
        suppressHydrationWarning
      >
        <PenLineIcon size={HEADER_ICON_SIZE} />
      </Link>

      <NotificationBell
        username={user.username}
        triggerClassName={HEADER_ICON_BTN_CLASS}
        iconSize={HEADER_ICON_SIZE}
      />

      <div className="relative flex items-center gap-0.5">
        <Link
          href={feedHref}
          onClick={() => setMenuOpen(false)}
          className="app-header-avatar-link"
          aria-label={t('my_profile')}
          suppressHydrationWarning
        >
          <UserAvatar username={user.username} size={32} />
        </Link>
        <button
          ref={triggerRef}
          type="button"
          id={`${menuId}-trigger`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? `${menuId}-menu` : undefined}
          aria-label={t('app_header_account_menu_aria')}
          onClick={() => setMenuOpen((o) => !o)}
          className={HEADER_ICON_BTN_CLASS}
        >
          <ChevronDownIcon size={HEADER_ICON_SIZE} />
        </button>

        {menuOpen ? (
          <div
            id={`${menuId}-menu`}
            role="menu"
            aria-labelledby={`${menuId}-trigger`}
            className="absolute end-0 top-full z-[60] mt-1 min-w-[12rem] rounded-card border border-border bg-surface py-1 shadow-card"
          >
            <Link
              href={feedHref}
              role="menuitem"
              aria-current={pathname === profileMainPath ? 'page' : undefined}
              className={menuNavLinkClassName(pathname === profileMainPath)}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('my_feed')}
            </Link>
            <Link
              href="/notifications/settings"
              role="menuitem"
              aria-current={isToolsHubPath(pathname) ? 'page' : undefined}
              className={menuNavLinkClassName(isToolsHubPath(pathname))}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('settings')}
            </Link>
            <Link
              href="/object-create"
              role="menuitem"
              aria-current={pathname === '/object-create' ? 'page' : undefined}
              className={menuNavLinkClassName(pathname === '/object-create')}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('create_object')}
            </Link>
            <Link
              href="/drafts"
              role="menuitem"
              aria-current={pathname === '/drafts' ? 'page' : undefined}
              className={menuNavLinkClassName(pathname === '/drafts')}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('drafts')}
            </Link>
            <Link
              href={businessRoutes.discoverOffers}
              role="menuitem"
              aria-current={
                pathname.startsWith('/business') ||
                pathname === '/offers' ||
                pathname.startsWith('/offers/')
                  ? 'page'
                  : undefined
              }
              className={menuNavLinkClassName(
                pathname.startsWith('/business') ||
                  pathname === '/offers' ||
                  pathname.startsWith('/offers/'),
              )}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('business_menu')}
            </Link>
            <Link
              href={profileAboutHref}
              role="menuitem"
              aria-current={pathname === profileAboutPath ? 'page' : undefined}
              className={menuNavLinkClassName(pathname === profileAboutPath)}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('my_profile')}
            </Link>
            <Link
              href={walletHref}
              role="menuitem"
              aria-current={
                pathname === walletPathPrefix ||
                pathname.startsWith(`${walletPathPrefix}/`)
                  ? 'page'
                  : undefined
              }
              className={menuNavLinkClassName(
                pathname === walletPathPrefix ||
                  pathname.startsWith(`${walletPathPrefix}/`),
              )}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('wallet')}
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={logoutPending}
              onClick={() => void onLogout()}
              className="flex w-full items-center rounded-btn px-3 py-2 text-start text-body-sm text-fg hover:bg-ghost-surface disabled:opacity-50"
            >
              {logoutPending ? '…' : t('logout')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

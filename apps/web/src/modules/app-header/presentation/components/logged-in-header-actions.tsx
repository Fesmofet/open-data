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
import { businessRoutes } from '@/modules/business';
import { NotificationBell } from '@/modules/notifications';
import { isToolsHubPath } from '@/modules/tools';
import { clearWalletSession } from '@/modules/auth/infrastructure';
import { UserAvatar } from '@/shared/presentation';

import type { AppHeaderUser } from '../../domain/app-header-user';

function WritePostIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 15.5 4 8h16l-8 7.5z" />
    </svg>
  );
}

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
        className="rounded-btn p-2 text-nav-fg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        suppressHydrationWarning
      >
        <WritePostIcon />
      </Link>

      <NotificationBell
        username={user.username}
        triggerClassName="relative rounded-btn p-2 text-nav-fg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
          className={[
            'inline-flex shrink-0 rounded-btn p-1 text-nav-fg',
            'hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          ].join(' ')}
        >
          <ChevronDownIcon />
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
              {t('tools')}
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
            <Link
              href="/settings"
              role="menuitem"
              aria-current={pathname === '/settings' ? 'page' : undefined}
              className={menuNavLinkClassName(pathname === '/settings')}
              onClick={() => setMenuOpen(false)}
              suppressHydrationWarning
            >
              {t('settings')}
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

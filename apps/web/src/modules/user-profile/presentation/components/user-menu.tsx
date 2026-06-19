'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  profileSectionTabClass,
  profileSectionVerticalLinkClass,
} from '@/shared/presentation';
import { getVisibleMenuKeys, useShellMode } from '@/shell-mode';

import { getSegmentsAfterAccount } from './profile-path';
import {
  getSubmenuVariant,
  getWalletTypeFromSearch,
  isFeedSectionActive,
} from './user-profile-subnav';
import { useUserProfileSocialCounts } from './user-profile-social-counts-context';
import { useEffectiveProfileNav } from './user-profile-pending-nav-context';
import { UserProfileNavLink } from './user-profile-nav-link';

export type UserMenuDirection = 'horizontal' | 'vertical';

type UserMenuProps = {
  accountName: string;
  direction?: UserMenuDirection;
};

const WALLET_TYPES = ['WAIV', 'HIVE', 'ENGINE'] as const;

function isActive(
  rest: string[],
  key:
    | 'feed'
    | 'map'
    | 'user-shop'
    | 'recipe'
    | 'favorites'
    | 'transfers'
    | 'followers'
    | 'expertise'
    | 'about',
): boolean {
  const head = rest[0] ?? '';
  switch (key) {
    case 'feed':
      return isFeedSectionActive(rest);
    case 'map':
      return head === 'map';
    case 'user-shop':
      return head === 'user-shop';
    case 'recipe':
      return head === 'recipe';
    case 'favorites':
      return head === 'favorites';
    case 'transfers':
      return head === 'transfers';
    case 'followers':
      return (
        head === 'followers' ||
        head === 'following' ||
        head === 'following-objects'
      );
    case 'expertise':
      return head === 'expertise-hashtags' || head === 'expertise-objects';
    case 'about':
      return head === 'about';
    default:
      return false;
  }
}

function navLinkClass(active: boolean, vertical: boolean) {
  if (vertical) {
    return profileSectionVerticalLinkClass(active, false);
  }
  return profileSectionTabClass(active, 'primary');
}

function subNavLinkClass(active: boolean, vertical: boolean) {
  if (vertical) {
    return profileSectionVerticalLinkClass(active, true);
  }
  return profileSectionTabClass(active, 'sub');
}

function SocialSubmenuLinkLabel({
  label,
  count,
}: {
  label: string;
  count?: number;
}) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 whitespace-nowrap">
      <span className="font-weight-strong">{label}</span>
      {count !== undefined ? (
        <span className="shrink-0 text-caption text-fg-secondary">{count}</span>
      ) : null}
    </span>
  );
}

function getFeedSubActive(rest: string[], segment: 'posts' | string): boolean {
  if (segment === 'posts') {
    return rest.length === 0;
  }
  return (rest[0] ?? '') === segment;
}

export function UserMenu(props: UserMenuProps) {
  return <UserMenuInner {...props} />;
}

function UserMenuInner({
  accountName,
  direction = 'horizontal',
}: UserMenuProps) {
  const { t } = useI18n();
  const { resolvedMode } = useShellMode();
  const visibleMenuKeys = getVisibleMenuKeys(resolvedMode);
  const { pathname, search } = useEffectiveProfileNav();
  const rest = getSegmentsAfterAccount(pathname);
  const base = `/@${accountName}`;
  const walletType = getWalletTypeFromSearch(search);
  const submenuVariant = getSubmenuVariant(pathname);
  const socialCounts = useUserProfileSocialCounts();

  const items: {
    key: string;
    href: string;
    label: string;
    active: boolean;
    mobileOnly?: boolean;
  }[] = [
      {
        key: 'feed',
        href: base,
        label: t('posts'),
        active: isActive(rest, 'feed'),
      },
      {
        key: 'map',
        href: `${base}/map`,
        label: t('map'),
        active: isActive(rest, 'map'),
      },
      {
        key: 'user-shop',
        href: `${base}/user-shop`,
        label: t('shop'),
        active: isActive(rest, 'user-shop'),
      },
      {
        key: 'recipe',
        href: `${base}/recipe`,
        label: t('user_profile_recipe'),
        active: isActive(rest, 'recipe'),
      },
      {
        key: 'favorites',
        href: `${base}/favorites`,
        label: t('favorites'),
        active: isActive(rest, 'favorites'),
      },
      {
        key: 'transfers',
        href: `${base}/transfers?type=WAIV`,
        label: t('wallet'),
        active: isActive(rest, 'transfers'),
      },
      {
        key: 'followers',
        href: `${base}/followers`,
        label: t('followers'),
        active: isActive(rest, 'followers'),
      },
      {
        key: 'expertise',
        href: `${base}/expertise-hashtags`,
        label: t('expertise'),
        active: isActive(rest, 'expertise'),
      },
      {
        key: 'about',
        href: `${base}/about`,
        label: t('about'),
        active: isActive(rest, 'about'),
        mobileOnly: true,
      },
    ];

  const primaryItems = visibleMenuKeys
    ? items.filter((item) => visibleMenuKeys.has(item.key))
    : items;

  const isVertical = direction === 'vertical';

  if (isVertical) {
    return (
      <div className="space-y-1">
        <nav className="flex flex-col gap-0.5" aria-label={t('user_profile_nav_aria')}>
          {primaryItems.map((item) => (
            <UserProfileNavLink
              key={item.key}
              href={item.href}
              className={navLinkClass(item.active, true)}
            >
              {item.label}
            </UserProfileNavLink>
          ))}
        </nav>

        {submenuVariant === 'feed' && visibleMenuKeys == null ? (
          <nav className="flex flex-col gap-0.5" aria-label={t('user_profile_submenu_feed_aria')}>
            <UserProfileNavLink href={base} className={subNavLinkClass(getFeedSubActive(rest, 'posts'), true)}>{t('posts')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/threads`} className={subNavLinkClass(getFeedSubActive(rest, 'threads'), true)}>{t('threads')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/comments`} className={subNavLinkClass(getFeedSubActive(rest, 'comments'), true)}>{t('comments')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/mentions`} className={subNavLinkClass(getFeedSubActive(rest, 'mentions'), true)}>{t('mentions')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/activity`} className={subNavLinkClass(getFeedSubActive(rest, 'activity'), true)}>{t('activity')}</UserProfileNavLink>
          </nav>
        ) : null}

        {submenuVariant === 'wallet' ? (
          <nav className="flex flex-col gap-0.5" aria-label={t('user_profile_submenu_wallet_aria')}>
            {WALLET_TYPES.map((type) => {
              const href = `${base}/transfers?type=${type}`;
              return (
                <UserProfileNavLink key={type} href={href} className={subNavLinkClass(walletType === type, true)}>
                  {type === 'WAIV' ? t('waiv_wallet') : type === 'HIVE' ? t('hive_wallet') : t('hive_engine_wallet')}
                </UserProfileNavLink>
              );
            })}
          </nav>
        ) : null}

        {submenuVariant === 'followers' ? (
          <nav className="flex flex-col gap-0.5" aria-label={t('user_profile_submenu_followers_aria')}>
            <UserProfileNavLink href={`${base}/followers`} className={subNavLinkClass((rest[0] ?? '') === 'followers', true)}>
              <SocialSubmenuLinkLabel label={t('followers')} count={socialCounts?.followerCount} />
            </UserProfileNavLink>
            <UserProfileNavLink href={`${base}/following`} className={subNavLinkClass((rest[0] ?? '') === 'following', true)}>
              <SocialSubmenuLinkLabel label={t('following')} count={socialCounts?.followingCount} />
            </UserProfileNavLink>
            <UserProfileNavLink href={`${base}/following-objects`} className={subNavLinkClass((rest[0] ?? '') === 'following-objects', true)}>
              <SocialSubmenuLinkLabel label={t('user_profile_following_objects')} count={socialCounts?.followingObjectsCount} />
            </UserProfileNavLink>
          </nav>
        ) : null}

        {submenuVariant === 'expertise' ? (
          <nav className="flex flex-col gap-0.5" aria-label={t('user_profile_submenu_expertise_aria')}>
            <UserProfileNavLink href={`${base}/expertise-hashtags`} className={subNavLinkClass((rest[0] ?? '') === 'expertise-hashtags', true)}>{t('hashtags')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/expertise-objects`} className={subNavLinkClass((rest[0] ?? '') === 'expertise-objects', true)}>{t('objects')}</UserProfileNavLink>
          </nav>
        ) : null}
      </div>
    );
  }

  // Horizontal layout: both rows share a single centered block so the sub-menu's
  // left edge aligns with the first item of the main menu.
  return (
    <div className="border-t border-border pt-3">
      <div className="mx-auto w-fit">
        <nav
          className="flex flex-wrap gap-x-1 gap-y-1 border-b border-border"
          aria-label={t('user_profile_nav_aria')}
        >
          {primaryItems.map((item) => (
            <UserProfileNavLink
              key={item.key}
              href={item.href}
              className={[
                navLinkClass(item.active, false),
                item.mobileOnly ? 'lg:hidden' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </UserProfileNavLink>
          ))}
        </nav>

        {submenuVariant === 'feed' && visibleMenuKeys == null ? (
          <nav
            className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-b border-border"
            aria-label={t('user_profile_submenu_feed_aria')}
          >
            <UserProfileNavLink href={base} className={subNavLinkClass(getFeedSubActive(rest, 'posts'), false)}>{t('posts')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/threads`} className={subNavLinkClass(getFeedSubActive(rest, 'threads'), false)}>{t('threads')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/comments`} className={subNavLinkClass(getFeedSubActive(rest, 'comments'), false)}>{t('comments')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/mentions`} className={subNavLinkClass(getFeedSubActive(rest, 'mentions'), false)}>{t('mentions')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/activity`} className={subNavLinkClass(getFeedSubActive(rest, 'activity'), false)}>{t('activity')}</UserProfileNavLink>
          </nav>
        ) : null}

        {submenuVariant === 'wallet' ? (
          <nav
            className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-b border-border"
            aria-label={t('user_profile_submenu_wallet_aria')}
          >
            {WALLET_TYPES.map((type) => {
              const href = `${base}/transfers?type=${type}`;
              return (
                <UserProfileNavLink key={type} href={href} className={subNavLinkClass(walletType === type, false)}>
                  {type === 'WAIV' ? t('waiv_wallet') : type === 'HIVE' ? t('hive_wallet') : t('hive_engine_wallet')}
                </UserProfileNavLink>
              );
            })}
          </nav>
        ) : null}

        {submenuVariant === 'followers' ? (
          <nav
            className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-b border-border"
            aria-label={t('user_profile_submenu_followers_aria')}
          >
            <UserProfileNavLink href={`${base}/followers`} className={subNavLinkClass((rest[0] ?? '') === 'followers', false)}>
              <SocialSubmenuLinkLabel label={t('followers')} count={socialCounts?.followerCount} />
            </UserProfileNavLink>
            <UserProfileNavLink href={`${base}/following`} className={subNavLinkClass((rest[0] ?? '') === 'following', false)}>
              <SocialSubmenuLinkLabel label={t('following')} count={socialCounts?.followingCount} />
            </UserProfileNavLink>
            <UserProfileNavLink href={`${base}/following-objects`} className={subNavLinkClass((rest[0] ?? '') === 'following-objects', false)}>
              <SocialSubmenuLinkLabel label={t('user_profile_following_objects')} count={socialCounts?.followingObjectsCount} />
            </UserProfileNavLink>
          </nav>
        ) : null}

        {submenuVariant === 'expertise' ? (
          <nav
            className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-b border-border"
            aria-label={t('user_profile_submenu_expertise_aria')}
          >
            <UserProfileNavLink href={`${base}/expertise-hashtags`} className={subNavLinkClass((rest[0] ?? '') === 'expertise-hashtags', false)}>{t('hashtags')}</UserProfileNavLink>
            <UserProfileNavLink href={`${base}/expertise-objects`} className={subNavLinkClass((rest[0] ?? '') === 'expertise-objects', false)}>{t('objects')}</UserProfileNavLink>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

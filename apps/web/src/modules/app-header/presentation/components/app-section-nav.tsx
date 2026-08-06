'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  OptimisticNavLink,
  profileSectionTabClass,
  useEffectiveNav,
} from '@/shared/presentation';
import {
  ShellFullBleedBand,
  ShellInset,
  HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS,
  horizontalTabNavScrollShellClass,
} from '@/shared/presentation/layout';

type SectionTab = {
  key: 'home' | 'data' | 'business';
  href: string;
  labelKey:
    | 'app_section_nav_home'
    | 'app_section_nav_data'
    | 'app_section_nav_business';
  isActive: (pathname: string) => boolean;
};

const TABS: SectionTab[] = [
  {
    key: 'home',
    href: '/',
    labelKey: 'app_section_nav_home',
    isActive: (pathname) => pathname === '/',
  },
  {
    key: 'data',
    href: '/discover',
    labelKey: 'app_section_nav_data',
    isActive: (pathname) =>
      pathname === '/discover' || pathname.startsWith('/discover/'),
  },
  {
    key: 'business',
    href: '/business',
    labelKey: 'app_section_nav_business',
    isActive: (pathname) =>
      pathname === '/business' || pathname.startsWith('/business/'),
  },
];

/**
 * Hub section tabs (FEED / DISCOVER / MARKET). Same shell pattern as profile primary nav.
 */
export function AppSectionNav() {
  const { t } = useI18n();
  const { pathname } = useEffectiveNav();

  return (
    <ShellFullBleedBand className="border-b border-border bg-surface">
      <ShellInset>
        <div className={horizontalTabNavScrollShellClass('gutter')}>
          <nav
            aria-label={t('app_section_nav_aria')}
            className={`${HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS} mx-auto w-max justify-center`}
          >
            {TABS.map((tab) => {
              const active = tab.isActive(pathname);
              return (
                <OptimisticNavLink
                  key={tab.key}
                  href={tab.href}
                  className={`${profileSectionTabClass(active, 'primary')} uppercase`}
                  aria-current={active ? 'page' : undefined}
                >
                  {t(tab.labelKey)}
                </OptimisticNavLink>
              );
            })}
          </nav>
        </div>
      </ShellInset>
    </ShellFullBleedBand>
  );
}

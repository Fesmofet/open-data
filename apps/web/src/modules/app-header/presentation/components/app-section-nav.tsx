'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  OptimisticNavLink,
  profileSectionTabClass,
  useEffectiveNav,
} from '@/shared/presentation';
import { isToolsHubPath } from '@/modules/tools';
import {
  ShellFullBleedBand,
  ShellInset,
  HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS,
  horizontalTabNavScrollShellClass,
} from '@/shared/presentation/layout';

type SectionTab = {
  key: 'home' | 'data' | 'business' | 'tools';
  href: string;
  labelKey:
    | 'app_section_nav_home'
    | 'app_section_nav_data'
    | 'app_section_nav_business'
    | 'app_section_nav_tools';
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
  {
    key: 'tools',
    href: '/notifications/settings',
    labelKey: 'app_section_nav_tools',
    isActive: (pathname) => isToolsHubPath(pathname),
  },
];

/**
 * Hub section tabs (HOME / DATA / BUSINESS / TOOLS). Same underline tab styles as profile primary nav.
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
            className={`${HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS} justify-start`}
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

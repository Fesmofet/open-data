'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { OptimisticNavLink } from '@/shared/presentation';

import { resolveToolsNavId, type ToolsNavId } from '../domain/tools-paths';

const NAV_ITEMS: { id: ToolsNavId; href: string; labelKey: string }[] = [
  {
    id: 'notifications',
    href: '/notifications/settings',
    labelKey: 'notifications',
  },
  {
    id: 'drafts',
    href: '/drafts',
    labelKey: 'drafts',
  },
  {
    id: 'settings',
    href: '/settings',
    labelKey: 'settings',
  },
];

function SectionToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      {expanded ? (
        <path d="M3 8h10" strokeLinecap="round" />
      ) : (
        <>
          <path d="M8 3v10" strokeLinecap="round" />
          <path d="M3 8h10" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function ToolsLayoutNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const active = resolveToolsNavId(pathname);
  const [expanded, setExpanded] = useState(true);

  return (
    <nav
      className="flex flex-col gap-2 border-b border-border pb-4 lg:border-b-0 lg:border-e lg:pb-0 lg:pe-6"
      aria-label={t('tools_nav_aria')}
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="font-label text-body-sm font-weight-strong text-heading">
          {t('sidenav_user_personal')}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-fg-secondary hover:bg-surface-control hover:text-fg"
          aria-expanded={expanded}
          aria-label={expanded ? t('tools_nav_collapse') : t('tools_nav_expand')}
        >
          <SectionToggleIcon expanded={expanded} />
        </button>
      </div>
      {expanded ? (
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === active;
            return (
              <OptimisticNavLink
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                suppressHydrationWarning
                className={[
                  'rounded-btn px-3 py-2 text-body-sm',
                  isActive
                    ? 'border border-border bg-surface font-weight-label text-accent'
                    : 'text-fg-secondary hover:text-fg',
                ].join(' ')}
              >
                {t(item.labelKey)}
              </OptimisticNavLink>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}

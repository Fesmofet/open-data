'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

export type ObjectCenterBreadcrumbsProps = {
  /** Object id of the root menu object — used for the external link icon. */
  rootObjectId: string;
  /** Name of the root menu object (e.g. "Menu"), shown as the first breadcrumb segment. */
  rootName: string;
  stack: Array<{ objectId: string; name: string }>;
  onNavigateTo: (depth: number) => void;
};

function OpenNestedObjectIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/**
 * Center-column breadcrumb / header for nested catalog navigation.
 *
 * - Stack empty  → shows just the root menu name + external link icon.
 * - Stack filled → shows full trail: `Menu > Dinner > Appetizers [icon]`.
 */
export function ObjectCenterBreadcrumbs({
  rootObjectId,
  rootName,
  stack,
  onNavigateTo,
}: ObjectCenterBreadcrumbsProps) {
  const { t } = useI18n();

  const last = stack.length > 0 ? stack[stack.length - 1]! : null;
  const iconTargetId = last?.objectId ?? rootObjectId;
  const iconTargetHref = `/object/${encodeURIComponent(iconTargetId)}`;
  const iconTargetName = last?.name ?? rootName;

  const linkClass =
    'truncate text-fg-secondary hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

  return (
    <nav
      aria-label={t('object_detail_breadcrumb_aria')}
      className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-body"
    >
      {/* Root menu — button when stack has items, plain text when at root */}
      <span className="inline-flex min-w-0 max-w-full items-center">
        {stack.length > 0 ? (
          <button
            type="button"
            className={linkClass}
            onClick={() => onNavigateTo(-1)}
          >
            {rootName}
          </button>
        ) : (
          <span className="truncate text-fg font-weight-strong">{rootName}</span>
        )}
      </span>

      {/* Nested stack segments */}
      {stack.map((entry, index) => (
        <span
          key={entry.objectId}
          className="inline-flex min-w-0 max-w-full items-center gap-x-1"
        >
          <span aria-hidden className="shrink-0 text-fg-tertiary">
            &gt;
          </span>
          {index === stack.length - 1 ? (
            <span className="truncate text-fg font-weight-strong">{entry.name}</span>
          ) : (
            <button
              type="button"
              className={linkClass}
              onClick={() => onNavigateTo(index)}
            >
              {entry.name}
            </button>
          )}
        </span>
      ))}

      {/* External link icon — points to deepest item, or root when stack is empty */}
      <Link
        href={iconTargetHref}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-1 inline-flex size-6 shrink-0 items-center justify-center rounded-btn border border-border text-fg-tertiary hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        title={iconTargetName}
        aria-label={`${t('object_detail_view')} ${iconTargetName}`}
        suppressHydrationWarning
      >
        <OpenNestedObjectIcon />
      </Link>
    </nav>
  );
}

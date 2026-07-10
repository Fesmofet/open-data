'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  buildObjectCategoryPath,
  resolveCategoryNameForObjectPage,
} from '@/modules/object/domain/object-page-url.constants';

const LEFT_RAIL_CATEGORY_COLLAPSED_COUNT = 2;

/** Browser pathname — usePathname() can lag behind the visible URL after proxy rewrites. */
function useVisibleObjectPathname(): string {
  const routerPathname = usePathname();
  const [browserPathname, setBrowserPathname] = useState(routerPathname);

  useEffect(() => {
    setBrowserPathname(window.location.pathname);
  }, [routerPathname]);

  if (browserPathname.includes('/category/')) {
    return browserPathname;
  }
  return routerPathname;
}

export type ObjectCategoryLeftRailSectionProps = {
  objectId: string;
  headingLabel: string;
  names: readonly string[];
  activeCategoryName?: string | null;
  editToolbar?: React.ReactNode;
};

export function ObjectCategoryLeftRailSection({
  objectId,
  headingLabel,
  names,
  activeCategoryName = null,
  editToolbar,
}: ObjectCategoryLeftRailSectionProps) {
  const { t } = useI18n();
  const visiblePathname = useVisibleObjectPathname();
  const searchParams = useSearchParams();
  const resolvedActiveName = useMemo(() => {
    const fromUrl = resolveCategoryNameForObjectPage(
      objectId,
      visiblePathname,
      searchParams,
    );
    return fromUrl ?? activeCategoryName;
  }, [activeCategoryName, objectId, searchParams, visiblePathname]);
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = names.length > LEFT_RAIL_CATEGORY_COLLAPSED_COUNT;
  const visibleNames =
    expanded || !hasOverflow ? names : names.slice(0, LEFT_RAIL_CATEGORY_COLLAPSED_COUNT);

  if (names.length === 0 && editToolbar == null) {
    return null;
  }

  return (
    <div className="space-y-1">
      {editToolbar}
      {names.length > 0 ? (
        <>
          <p className="text-fg text-body-sm font-weight-body">
            {headingLabel}:
          </p>
          <ul className="mt-1 space-y-1">
            {visibleNames.map((name, index) => {
              const isActive = resolvedActiveName === name;
              return (
                <li key={`${name}-${index}`}>
                  <Link
                    href={buildObjectCategoryPath(objectId, name)}
                    className={
                      isActive
                        ? 'object-category-left-rail-link object-category-left-rail-link--active'
                        : 'object-category-left-rail-link'
                    }
                    aria-current={isActive ? 'page' : undefined}
                    suppressHydrationWarning
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
          {hasOverflow ? (
            <button
              type="button"
              className="mt-1 text-body-sm text-accent hover:underline"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? t('object_updates_show_less') : t('show_more')}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

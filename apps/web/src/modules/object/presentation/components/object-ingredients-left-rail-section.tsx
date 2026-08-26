'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { buildDiscoverHref } from '@/modules/discover/domain/discover-url';

import { cleanIngredientSearchQuery } from '../../domain/clean-ingredient-search-query';

const LEFT_RAIL_INGREDIENTS_COLLAPSED_COUNT = 5;

export type ObjectIngredientsLeftRailSectionProps = {
  headingLabel: string;
  items: readonly string[];
  objectTypeKey: string;
  editToolbar?: React.ReactNode;
};

export function ObjectIngredientsLeftRailSection({
  headingLabel,
  items,
  objectTypeKey,
  editToolbar,
}: ObjectIngredientsLeftRailSectionProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = items.length > LEFT_RAIL_INGREDIENTS_COLLAPSED_COUNT;
  const visibleItems =
    expanded || !hasOverflow
      ? items
      : items.slice(0, LEFT_RAIL_INGREDIENTS_COLLAPSED_COUNT);

  if (items.length === 0 && editToolbar == null) {
    return null;
  }

  return (
    <div className="space-y-1">
      {editToolbar}
      {items.length > 0 ? (
        <>
          <p className="text-body-sm font-weight-body text-fg">{headingLabel}:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {visibleItems.map((item, index) => {
              const searchQuery = cleanIngredientSearchQuery(item);
              const href = buildDiscoverHref({
                type: objectTypeKey,
                ...(searchQuery ? { q: searchQuery } : {}),
              });

              return (
              <li key={`${item}-${index}`} className="text-body-sm text-fg">
                <Link
                  href={href}
                  prefetch={false}
                  className="text-link hover:underline"
                  suppressHydrationWarning
                >
                  {item}
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
              {expanded
                ? t('object_updates_show_less')
                : t('show_all_ingredients').replace('{count}', String(items.length))}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

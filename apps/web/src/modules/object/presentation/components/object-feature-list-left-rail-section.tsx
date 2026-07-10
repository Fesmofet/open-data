'use client';

import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { FeatureListItem } from '../../domain/object-page.types';

const LEFT_RAIL_FEATURE_LIST_COLLAPSED_COUNT = 2;

export type ObjectFeatureListLeftRailSectionProps = {
  headingLabel: string;
  items: readonly FeatureListItem[];
  editToolbar?: React.ReactNode;
};

export function ObjectFeatureListLeftRailSection({
  headingLabel,
  items,
  editToolbar,
}: ObjectFeatureListLeftRailSectionProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = items.length > LEFT_RAIL_FEATURE_LIST_COLLAPSED_COUNT;
  const visibleItems =
    expanded || !hasOverflow
      ? items
      : items.slice(0, LEFT_RAIL_FEATURE_LIST_COLLAPSED_COUNT);

  if (items.length === 0 && editToolbar == null) {
    return null;
  }

  return (
    <div className="space-y-1">
      {editToolbar}
      {items.length > 0 ? (
        <>
          <p className="text-body-sm font-weight-body text-fg">{headingLabel}:</p>
          <ul className="mt-1 list-none space-y-1 p-0">
            {visibleItems.map((item, index) => (
              <li key={`${item.key}-${index}`} className="text-body-sm text-fg">
                {item.key}: {item.value}
              </li>
            ))}
          </ul>
          {hasOverflow ? (
            <button
              type="button"
              className="mt-1 text-body-sm text-accent hover:underline"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? t('object_updates_show_less') : t('show_more_features')}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

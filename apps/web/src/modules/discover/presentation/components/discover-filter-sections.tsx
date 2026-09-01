'use client';

import { ChevronDownIcon } from '@/icons';

import { encodeTagFilter } from '../../domain/discover-url';
import type { TagCategorySection } from '../hooks/use-discover-tag-categories';

/** Max height for scrollable item list inside an expanded category (~14 rows). */
const CATEGORY_LIST_MAX_HEIGHT = 'max-h-72';

export type DiscoverFilterSectionsProps = {
  sections: TagCategorySection[];
  tags: string[];
  collapsedCategories: Set<string>;
  onToggleCollapse: (category: string) => void;
  onToggleTag: (encoded: string, checked: boolean) => void;
  /** When set, only items whose value matches (case-insensitive) are shown. */
  itemSearchQuery?: string;
};

function filterSectionsBySearch(
  sections: TagCategorySection[],
  query: string,
): TagCategorySection[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return sections;
  }
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.value.toLowerCase().includes(needle)),
    }))
    .filter((section) => section.items.length > 0);
}

export function DiscoverFilterSections({
  sections,
  tags,
  collapsedCategories,
  onToggleCollapse,
  onToggleTag,
  itemSearchQuery = '',
}: DiscoverFilterSectionsProps) {
  const visibleSections = filterSectionsBySearch(sections, itemSearchQuery);

  return (
    <div className="space-y-1">
      {visibleSections.map((section) => {
        const collapsed = collapsedCategories.has(section.category);

        return (
          <section
            key={section.category}
            className="border-b border-border pb-2 last:border-b-0"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between py-1.5 text-start text-body-sm font-weight-label text-fg"
              onClick={() => onToggleCollapse(section.category)}
              aria-expanded={!collapsed}
            >
              <span>{section.category}</span>
              <ChevronDownIcon
                size={12}
                className={`shrink-0 text-fg-secondary transition-transform duration-150 ${
                  collapsed ? '' : 'rotate-180'
                }`}
              />
            </button>
            {!collapsed ? (
              <div
                className={`${CATEGORY_LIST_MAX_HEIGHT} scrollbar-minimal overflow-y-auto pe-0.5`}
              >
                <ul className="flex flex-col gap-1 pb-1">
                  {section.items.map((item) => {
                    const encoded = encodeTagFilter(section.category, item.value);
                    const checked = tags.includes(encoded);
                    return (
                      <li key={`${section.category}-${item.value}`}>
                        <label className="flex cursor-pointer items-center gap-2 text-body-sm text-fg-secondary hover:text-fg">
                          <input
                            type="checkbox"
                            className="rounded border-border"
                            checked={checked}
                            onChange={(e) => onToggleTag(encoded, e.target.checked)}
                          />
                          <span className="min-w-0 flex-1 truncate">{item.value}</span>
                          <span className="tabular-nums text-caption">({item.count})</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchDiscoverTagCategories } from '../../infrastructure/discover.client';
import type { DiscoverTagCategoriesResponse } from '../../domain/discover-response.schema';
import { getTagCategoryNamesForObjectType } from '../../domain/discover-registry';
import { encodeTagFilter } from '../../domain/discover-url';

const DEFAULT_OPEN_CATEGORIES = 2;

export type TagCategorySection = {
  category: string;
  items: { value: string; count: number }[];
};

export function orderTagSections(
  categories: DiscoverTagCategoriesResponse['categories'] | undefined,
  registryOrder: string[],
): TagCategorySection[] {
  const sections: TagCategorySection[] =
    categories ??
    registryOrder.map((category) => ({
      category,
      items: [] as { value: string; count: number }[],
    }));

  if (registryOrder.length === 0) {
    return sections;
  }
  return [
    ...registryOrder
      .map((name) => sections.find((s) => s.category === name))
      .filter((s): s is TagCategorySection => s != null),
    ...sections.filter((s) => !registryOrder.includes(s.category)),
  ];
}

function buildDefaultCollapsed(
  sections: TagCategorySection[],
  selectedTags: string[],
): Set<string> {
  const collapsed = new Set<string>();
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const hasSelected = section.items.some((item) =>
      selectedTags.includes(encodeTagFilter(section.category, item.value)),
    );
    if (i >= DEFAULT_OPEN_CATEGORIES && !hasSelected) {
      collapsed.add(section.category);
    }
  }
  return collapsed;
}

export type UseDiscoverTagCategoriesParams = {
  objectType: string;
  q: string;
  tags: string[];
};

export function useDiscoverTagCategories({
  objectType,
  q,
  tags,
}: UseDiscoverTagCategoriesParams) {
  const [data, setData] = useState<DiscoverTagCategoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => new Set());

  const registryOrder = useMemo(
    () => getTagCategoryNamesForObjectType(objectType),
    [objectType],
  );

  const orderedSections = useMemo(
    () => orderTagSections(data?.categories, registryOrder),
    [data?.categories, registryOrder],
  );

  useEffect(() => {
    setCollapsedCategories(new Set());
  }, [objectType, registryOrder]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    void (async () => {
      const res = await fetchDiscoverTagCategories(objectType, {
        tags,
        q: q.trim() || undefined,
        signal: ac.signal,
      });
      if (!ac.signal.aborted) {
        setData(res);
        if (res && tags.length === 0) {
          setCollapsedCategories(
            buildDefaultCollapsed(orderTagSections(res.categories, registryOrder), tags),
          );
        }
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [objectType, tags, q, registryOrder]);

  useEffect(() => {
    if (tags.length === 0 || !data?.categories) {
      return;
    }
    const sections = orderTagSections(data.categories, registryOrder);
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const section of sections) {
        const hasSelected = section.items.some((item) =>
          tags.includes(encodeTagFilter(section.category, item.value)),
        );
        if (hasSelected && next.has(section.category)) {
          next.delete(section.category);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tags, data, registryOrder]);

  const toggleCollapse = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return {
    loading,
    orderedSections,
    collapsedCategories,
    toggleCollapse,
  };
}

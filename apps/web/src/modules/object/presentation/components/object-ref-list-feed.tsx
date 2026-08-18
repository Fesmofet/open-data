'use client';

import Link from 'next/link';
import { useCallback, useMemo, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';
import { ObjectCard } from '@/modules/feed/presentation/components/object-card';
import {
  ObjectThumbnail,
  useInfiniteScroll,
  useSyncedPaginatedList,
} from '@/shared/presentation';

import type { ObjectRefCardView } from '../../domain/object-page.types';
import type { ObjectRefRelation } from '../../infrastructure/object-ref-list.client';

export type ObjectRefCardProps = {
  item: ObjectRefCardView;
  href?: string;
};

export function ObjectRefCard({ item, href }: ObjectRefCardProps) {
  const card = (
    <div className="flex w-full min-w-0 gap-2 rounded-btn border border-border bg-bg p-2 transition-colors hover:bg-surface">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-btn border border-border">
        <ObjectThumbnail
          src={item.imageSrc}
          fill
          size={48}
          avatarSize="small"
          className="object-cover"
          sizes="48px"
        />
      </div>
      <p className="min-w-0 flex-1 self-center truncate text-body-sm font-weight-label leading-body text-fg">
        {item.title}
      </p>
    </div>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      className="block w-full min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      suppressHydrationWarning
    >
      {card}
    </Link>
  );
}

export type ObjectRefListFeedProps = {
  objectId: string;
  relation: ObjectRefRelation;
  initialItems: ProjectedObjectView[];
  initialCursor: string | null;
  initialHasMore: boolean;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  loadMoreAction: (
    objectId: string,
    relation: ObjectRefRelation,
    cursor: string | null,
  ) => Promise<{ items: ProjectedObjectView[]; hasMore: boolean; cursor: string | null }>;
};

export function ObjectRefListFeed({
  objectId,
  relation,
  initialItems,
  initialCursor,
  initialHasMore,
  viewerUsername,
  onRequireLogin,
  loadMoreAction,
}: ObjectRefListFeedProps) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const initialPage = useMemo(
    () => ({
      items: initialItems,
      hasMore: initialHasMore,
      cursor: initialCursor,
    }),
    [initialItems, initialHasMore, initialCursor],
  );
  const { items, hasMore, cursor, setItems, setHasMore, setCursor } =
    useSyncedPaginatedList(initialPage);

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const page = await loadMoreAction(objectId, relation, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setCursor(page.cursor);
    });
  }, [
    cursor,
    hasMore,
    loadMoreAction,
    objectId,
    pending,
    relation,
    setCursor,
    setHasMore,
    setItems,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  if (items.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface/60 p-card-padding text-body-sm text-muted">
        {t('object_ref_list_empty')}
      </p>
    );
  }

  return (
    <section>
      <ul className="divide-y divide-border rounded-card border border-border bg-surface">
        {items.map((o) => (
          <ObjectCard
            key={o.object_id}
            layout="catalog"
            object={o}
            viewerUsername={viewerUsername}
            onRequireLogin={onRequireLogin}
          />
        ))}
      </ul>
      {hasMore ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            className="sr-only"
            disabled={pending}
            onClick={onLoadMore}
          >
            {t('object_right_show_more')}
          </button>
          {pending ? (
            <p className="text-body-sm text-muted" aria-live="polite">
              {t('drafts_loading')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

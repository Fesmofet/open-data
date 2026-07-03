'use client';

import { useCallback, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ObjectCard } from '@/modules/feed/presentation';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';
import { FeedColumn } from '@/shared/presentation/layout';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

import { useLoginModal } from '@/modules/auth';

import { loadMoreExpertiseObjectsAction } from '@/app/(app)/user-profile/[name]/expertise-feed.actions';

import type { ExpertiseObjectsPage, ExpertiseScope } from '../../domain/types/expertise';

export type ExpertiseObjectListProps = {
  accountName: string;
  scope: ExpertiseScope;
  initialPage: ExpertiseObjectsPage;
  viewerUsername?: string | null;
};

export function ExpertiseObjectList({
  accountName,
  scope,
  initialPage,
  viewerUsername,
}: ExpertiseObjectListProps) {
  const { t } = useI18n();
  const { openLogin } = useLoginModal();
  const { items, setItems, hasMore, setHasMore } = useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreExpertiseObjectsAction(accountName, scope, items.length);
      setItems((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
    });
  }, [accountName, hasMore, items.length, pending, scope, setHasMore, setItems]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  if (items.length === 0) {
    return (
      <section
        className="rounded-card border border-border bg-surface/80 p-card-padding"
        aria-labelledby="expertise-objects-empty"
      >
        <h2 id="expertise-objects-empty" className="text-body-lg font-weight-strong font-display text-fg">
          {t('expertise')}
        </h2>
        <p className="mt-2 text-body-sm text-muted">{t('users_start_with_zero_expertise')}</p>
      </section>
    );
  }

  return (
    <FeedColumn>
      <ul className="flex flex-col gap-card-padding">
        {items.map((item) => (
          <ObjectCard
            key={item.object_id}
            object={item as ProjectedObjectView}
            userWeight={item.user_weight}
            viewerUsername={viewerUsername}
            onRequireLogin={openLogin}
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
            {t('drafts_load_more')}
          </button>
        </div>
      ) : null}
    </FeedColumn>
  );
}

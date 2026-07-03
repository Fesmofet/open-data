'use client';

import { useCallback, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

import type {
  LoadMoreObjectExpertsFn,
  PaginatedObjectExpertListView,
} from '@/modules/object/domain/types/object-experts';
import { UserSocialAccountRow } from '@/modules/user-social/presentation/components/user-social-account-row';

export type ObjectExpertsAccountListProps = {
  objectId: string;
  initialPage: PaginatedObjectExpertListView;
  currentUsername: string | null;
  loadMoreAction: LoadMoreObjectExpertsFn;
  onBroadcastRevalidate?: (objectId: string) => Promise<void>;
};

export function ObjectExpertsAccountList({
  objectId,
  initialPage,
  currentUsername,
  loadMoreAction,
  onBroadcastRevalidate,
}: ObjectExpertsAccountListProps) {
  const { t } = useI18n();
  const { items, setItems, hasMore, setHasMore } = useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreAction(objectId, items.length);
      setItems((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
    });
  }, [
    hasMore,
    pending,
    loadMoreAction,
    objectId,
    items.length,
    setHasMore,
    setItems,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  return (
    <section
      className="rounded-card border border-border bg-surface/80 p-card-padding"
      aria-labelledby={`object-experts-list-${objectId}`}
    >
      <h2 id={`object-experts-list-${objectId}`} className="sr-only">
        {t('experts')}
      </h2>
      {items.length === 0 ? (
        <p className="text-body-sm text-muted">{t('social_list_empty_experts')}</p>
      ) : (
        <>
          <ul>
            {items.map((row) => (
              <UserSocialAccountRow
                key={row.name}
                row={{
                  name: row.name,
                  avatarUrl: row.avatarUrl,
                  wobjectsWeight: 0,
                  usersFollowingCount: row.usersFollowingCount,
                  isCurrentFollowing: row.isCurrentFollowing,
                }}
                profileAccountName={objectId}
                viewerUsername={currentUsername}
                expertiseWeight={row.objectExpertiseWeight}
                expertiseTooltipKey="stat_object_expertise_tooltip"
                onBroadcastRevalidate={onBroadcastRevalidate}
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
              {pending ? (
                <p className="text-body-sm text-muted" aria-live="polite">
                  {t('drafts_loading')}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

'use client';

import { useCallback, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

import type {
  PaginatedUserFollowListView,
  UserSubscriptionSort,
  LoadMoreUserSocialAccountListFn,
} from '@/modules/user-social/application/dto/user-social.dto';

import { UserSocialAccountRow } from './user-social-account-row';
import { UserSocialSubscriptionSort } from './user-social-subscription-sort';

export type UserSocialAccountListKind =
  | 'followers'
  | 'following'
  | 'favorited_by'
  | 'ownership_supervised'
  | 'ownership_exclusive';

export type UserSocialAccountListProps = {
  profileAccountName: string;
  listKind: UserSocialAccountListKind;
  initialPage: PaginatedUserFollowListView;
  sort: UserSubscriptionSort;
  currentUsername: string | null;
  loadMoreAction: LoadMoreUserSocialAccountListFn;
  /** Server action — pass by reference from RSC (not an inline arrow). */
  onBroadcastRevalidate?: (accountName: string) => Promise<void>;
};

export function UserSocialAccountList({
  profileAccountName,
  listKind,
  initialPage,
  sort,
  currentUsername,
  loadMoreAction,
  onBroadcastRevalidate,
}: UserSocialAccountListProps) {
  const { t } = useI18n();
  const { items, setItems, hasMore, setHasMore } = useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreAction(profileAccountName, sort, items.length);
      setItems((prev) => [...prev, ...next.items]);
      // Stop pagination when the server returns an empty page (avoids infinite scroll loops
      // when total/hasMore drift from list rows, e.g. ownership rows without accounts_current).
      setHasMore(next.items.length > 0 && next.hasMore);
    });
  }, [
    hasMore,
    pending,
    loadMoreAction,
    profileAccountName,
    sort,
    items.length,
    setHasMore,
    setItems,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  const emptyKey =
    listKind === 'followers'
      ? 'social_list_empty_followers'
      : listKind === 'following'
        ? 'social_list_empty_following'
        : listKind === 'favorited_by'
          ? 'social_list_empty_favorited_by'
          : listKind === 'ownership_supervised'
            ? 'social_list_empty_ownership_supervised'
            : 'social_list_empty_ownership_exclusive';

  const headingKey =
    listKind === 'followers'
      ? 'followers'
      : listKind === 'following'
        ? 'following'
        : listKind === 'favorited_by'
          ? 'object_followers_sub_favorited_by'
          : listKind === 'ownership_supervised'
            ? 'object_ownership_sub_supervised'
            : 'object_ownership_sub_exclusive';

  return (
    <section
      className="rounded-card border border-border bg-surface/80 p-card-padding"
      aria-labelledby={`social-list-${listKind}-${profileAccountName}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <h2 id={`social-list-${listKind}-${profileAccountName}`} className="sr-only">
          {t(headingKey)}
        </h2>
        <UserSocialSubscriptionSort />
      </div>
      {items.length === 0 ? (
        <p className="text-body-sm text-muted">{t(emptyKey)}</p>
      ) : (
        <>
          <ul>
            {items.map((row) => (
              <UserSocialAccountRow
                key={row.name}
                row={row}
                profileAccountName={profileAccountName}
                viewerUsername={currentUsername}
                onBroadcastRevalidate={onBroadcastRevalidate}
              />
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
              <button
                type="button"
                className="sr-only"
                disabled={pending}
                onClick={() => onLoadMore()}
              >
                {t('social_list_load_more')}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

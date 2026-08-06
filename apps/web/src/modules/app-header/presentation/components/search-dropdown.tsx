'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StatHoverTooltip, UserAvatar } from '@/shared/presentation';

import type { SearchCountsResponse, SearchResponse } from '../../domain/search-response.schema';
import type { SearchFlatEntry } from '../../domain/search-nav-list';
import { buildDiscoverHrefFromSearch, formatObjectTypeLabel } from '../../domain/search-nav-list';

const CHIP_SKELETON_WIDTHS = [56, 72, 64] as const;

const EMPTY_RESULTS: SearchResponse = { objects: [], users: [] };

export type SearchDropdownProps = {
  results: SearchResponse;
  resultsLoading: boolean;
  counts: SearchCountsResponse | null;
  countsLoading: boolean;
  activeIndex: number;
  flatList: SearchFlatEntry[];
  onHighlightIndex: (index: number) => void;
  listId: string;
  searchQuery: string;
  messages: {
    sectionObjects: string;
    sectionUsers: string;
    empty: string;
    loading: string;
    tabUsers: string;
    following: string;
    discoverChipsAria: string;
    userExpertiseTooltip: string;
    userFollowersTooltip: string;
  };
  onClose: () => void;
};

function pickFlatIndexForRow(
  flatList: SearchFlatEntry[],
  kind: 'object' | 'user',
  key: string,
): number {
  return flatList.findIndex((e) =>
    kind === 'object'
      ? e.kind === 'object' && e.item.object_id === key
      : e.kind === 'user' && e.item.name === key,
  );
}

function discoverChipClass(): string {
  return [
    'rounded-pill border border-transparent bg-surface-control px-2.5 py-1 text-caption text-fg-secondary transition-colors',
    'hover:bg-ghost-surface hover:text-fg',
  ].join(' ');
}

function ChipCountSuffix({ loading, value }: { loading: boolean; value: number }) {
  if (loading) {
    return (
      <span
        className="ms-0.5 inline-block h-3 w-7 align-middle rounded-btn bg-surface-control animate-pulse"
        aria-hidden
      />
    );
  }
  return <span className="tabular-nums"> ({value})</span>;
}

function DiscoverChipSkeletons() {
  return CHIP_SKELETON_WIDTHS.map((w) => (
    <span
      key={w}
      className="h-7 shrink-0 rounded-circle bg-surface-control animate-pulse"
      style={{ width: w }}
      aria-hidden
    />
  ));
}

export function SearchDropdown({
  results,
  resultsLoading,
  counts,
  countsLoading,
  activeIndex,
  flatList,
  onHighlightIndex,
  listId,
  messages,
  onClose,
  searchQuery,
}: SearchDropdownProps) {
  const router = useRouter();

  const hasGlobalCounts = counts !== null;
  const countsPending = countsLoading && !hasGlobalCounts;

  const objectTypeChips = hasGlobalCounts
    ? Object.entries(counts.type_counts)
        .filter(([, n]) => n > 0)
        .sort(([a], [b]) => a.localeCompare(b))
    : [...new Set(results.objects.map((o) => o.object_type))]
        .sort((a, b) => a.localeCompare(b))
        .map((ot) => [ot, results.objects.filter((o) => o.object_type === ot).length] as const);

  const usersChipCount = hasGlobalCounts ? counts.total_users : results.users.length;
  const showUsersChip = usersChipCount > 0;

  function navigateEntry(entry: SearchFlatEntry) {
    onClose();
    if (entry.kind === 'object') {
      router.push(`/object/${encodeURIComponent(entry.item.object_id)}`);
    } else {
      router.push(`/@${encodeURIComponent(entry.item.name)}`);
    }
  }

  const hasResults = results.objects.length > 0 || results.users.length > 0;
  const showResultsBody = !resultsLoading || hasResults;

  const showObjectsSection = showResultsBody && results.objects.length > 0;
  const showUsersSection = showResultsBody && results.users.length > 0;

  const isEmpty = !resultsLoading && !hasResults;

  return (
    <div className="grid max-h-[min(70vh,28rem)] grid-rows-[auto_minmax(0,1fr)]">
      <nav
        className="shrink-0 border-b border-border bg-surface px-2 py-2"
        aria-label={messages.discoverChipsAria}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {countsPending ? (
            <DiscoverChipSkeletons />
          ) : (
            <>
              {objectTypeChips.map(([ot, count]) => (
                <Link
                  key={ot}
                  href={buildDiscoverHrefFromSearch(ot, searchQuery)}
                  className={discoverChipClass()}
                  onClick={() => onClose()}
                >
                  {formatObjectTypeLabel(ot)}
                  <ChipCountSuffix loading={countsPending} value={count} />
                </Link>
              ))}
              {showUsersChip ? (
                <Link
                  href={buildDiscoverHrefFromSearch('users', searchQuery)}
                  className={discoverChipClass()}
                  onClick={() => onClose()}
                >
                  {messages.tabUsers}
                  <ChipCountSuffix loading={countsPending} value={usersChipCount} />
                </Link>
              ) : null}
            </>
          )}
        </div>
      </nav>

      <div className="min-h-0 overflow-y-auto bg-surface py-1">
        {resultsLoading && !hasResults ? (
          <p className="px-3 py-4 text-body-sm text-fg-secondary">{messages.loading}</p>
        ) : null}

        {!resultsLoading && isEmpty ? (
          <p className="px-3 py-4 text-body-sm text-fg-secondary">{messages.empty}</p>
        ) : null}

        {showObjectsSection ? (
          <div className="px-2 pt-2">
            <p className="px-1 pb-1 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
              {messages.sectionObjects}
            </p>
            <ul className="divide-y divide-border" role="listbox" id={`${listId}-objects`}>
              {results.objects.map((obj) => {
                const flatIdx = pickFlatIndexForRow(flatList, 'object', obj.object_id);
                const active = flatIdx >= 0 && flatIdx === activeIndex;
                const title = obj.name?.trim() || obj.object_id;
                return (
                  <li key={obj.object_id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={[
                        'flex w-full items-center gap-2 px-2 py-2 text-start',
                        active ? 'bg-ghost-surface' : 'hover:bg-ghost-surface',
                      ].join(' ')}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => {
                        if (flatIdx >= 0) {
                          onHighlightIndex(flatIdx);
                        }
                      }}
                      onClick={() => {
                        const entry = flatList[flatIdx];
                        if (entry?.kind === 'object') {
                          navigateEntry(entry);
                        }
                      }}
                    >
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-btn bg-surface-control">
                        {obj.image_url ? (
                          <img
                            src={obj.image_url}
                            alt=""
                            className="h-10 w-10 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-caption text-fg-tertiary">
                            —
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-weight-label text-fg">{title}</span>
                        {obj.parent_name ? (
                          <span className="block truncate text-body-sm text-fg-secondary">
                            {obj.parent_name}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 rounded-btn bg-surface-control px-1.5 py-0.5 text-caption text-fg-secondary">
                        {formatObjectTypeLabel(obj.object_type)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {showUsersSection ? (
          <div className="px-2 pt-2">
            <p className="px-1 pb-1 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
              {messages.sectionUsers}
            </p>
            <ul className="divide-y divide-border" role="listbox" id={`${listId}-users`}>
              {results.users.map((u) => {
                const flatIdx = pickFlatIndexForRow(flatList, 'user', u.name);
                const active = flatIdx >= 0 && flatIdx === activeIndex;
                return (
                  <li key={u.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={[
                        'flex w-full items-center gap-2 px-2 py-2 text-start',
                        active ? 'bg-ghost-surface' : 'hover:bg-ghost-surface',
                      ].join(' ')}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => {
                        if (flatIdx >= 0) {
                          onHighlightIndex(flatIdx);
                        }
                      }}
                      onClick={() => {
                        const entry = flatList[flatIdx];
                        if (entry?.kind === 'user') {
                          navigateEntry(entry);
                        }
                      }}
                    >
                      <UserAvatar
                        username={u.name}
                        avatarUrl={u.profile_image}
                        size={40}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-weight-label text-fg">{u.name}</span>
                          <StatHoverTooltip content={messages.userExpertiseTooltip}>
                            <span className="rounded border border-border bg-surface-control px-1.5 py-0.5 font-mono text-caption text-fg">
                              {(u.wobjects_weight ?? 0).toFixed(2)}
                            </span>
                          </StatHoverTooltip>
                          <span aria-hidden className="text-caption text-fg-secondary">
                            ·
                          </span>
                          <StatHoverTooltip content={messages.userFollowersTooltip}>
                            <span className="text-caption text-fg-secondary">
                              {u.followers_count}
                            </span>
                          </StatHoverTooltip>
                        </span>
                      </span>
                      {u.is_following ? (
                        <span className="shrink-0 rounded-btn bg-surface-control px-1.5 py-0.5 text-caption text-fg-secondary">
                          {messages.following}
                        </span>
                      ) : (
                        <span className="shrink-0 w-16" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { EMPTY_RESULTS };

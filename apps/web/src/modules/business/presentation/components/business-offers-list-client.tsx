'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

import {
  loadMoreManageOffersAction,
  loadMoreOblDraftsAction,
} from '../../infrastructure/actions/load-more-obl.server';
import {
  businessNavIdForKind,
  businessRoutes,
  type OblOfferKindRoute,
  type OffersListTab,
} from '../../domain/routes';
import type { OblOffsetPage } from '../../domain/obl-pagination.types';
import type { OblOfferDraftView } from '../../infrastructure/clients/obl-drafts.server';
import type { OblOfferApiRow } from '../../infrastructure/clients/obl-offers.server';
import { createOblDraftAction } from '../../infrastructure/actions/obl-drafts.actions';
import { StateBadge } from './state-badge';
import {
  BusinessEmptyState,
  BusinessPageShell,
} from '../layout/business-page-shell';

export type BusinessOffersListClientProps = {
  username: string;
  kind: OblOfferKindRoute;
  tab: OffersListTab;
  initialDrafts: OblOffsetPage<OblOfferDraftView>;
  initialPublished: OblOffsetPage<OblOfferApiRow>;
};

export function BusinessOffersListClient({
  username,
  kind,
  tab,
  initialDrafts,
  initialPublished,
}: BusinessOffersListClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const draftsState = useSyncedPaginatedList(initialDrafts);
  const publishedState = useSyncedPaginatedList(initialPublished);

  const kindDrafts = useMemo(
    () => draftsState.items.filter((draft) => draft.kind === kind),
    [draftsState.items, kind],
  );
  const publishedRows = useMemo(
    () => publishedState.items.filter((row) => row.kind === kind),
    [publishedState.items, kind],
  );

  const title = kind === 'offer' ? t('business_offers_title') : t('business_requests_title');
  const subtitle =
    kind === 'offer' ? t('business_offers_subtitle') : t('business_requests_subtitle');
  const createLabel =
    kind === 'offer' ? t('business_create_offer') : t('business_create_request');

  const onLoadMoreDrafts = useCallback(() => {
    if (!draftsState.hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreOblDraftsAction(username, draftsState.items.length);
      draftsState.setItems((prev) => [...prev, ...next.items]);
      draftsState.setHasMore(next.hasMore);
    });
  }, [draftsState, pending, username]);

  const onLoadMorePublished = useCallback(() => {
    if (!publishedState.hasMore || pending) {
      return;
    }
    const status = tab === 'retired' ? 'retired' : 'active';
    startTransition(async () => {
      const next = await loadMoreManageOffersAction({
        author: username,
        kind,
        status,
        offset: publishedState.items.length,
      });
      publishedState.setItems((prev) => [...prev, ...next.items]);
      publishedState.setHasMore(next.hasMore);
    });
  }, [kind, pending, publishedState, tab, username]);

  const { sentinelRef: draftsSentinelRef } = useInfiniteScroll({
    hasMore: tab === 'drafts' && draftsState.hasMore,
    isLoading: pending,
    onLoadMore: onLoadMoreDrafts,
  });

  const { sentinelRef: publishedSentinelRef } = useInfiniteScroll({
    hasMore: (tab === 'published' || tab === 'retired') && publishedState.hasMore,
    isLoading: pending,
    onLoadMore: onLoadMorePublished,
  });

  async function onCreateDraft() {
    setCreating(true);
    try {
      const result = await createOblDraftAction(username, {
        kind,
        fields: { name: '' },
      });
      if (result.ok) {
        router.push(businessRoutes.offerDraft(kind, result.value.draftId));
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <BusinessPageShell
      activeNav={businessNavIdForKind(kind)}
      title={title}
      subtitle={subtitle}
      actions={
        <button
          type="button"
          disabled={creating}
          onClick={() => void onCreateDraft()}
          className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
        >
          {creating ? '…' : createLabel}
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(['drafts', 'published', 'retired'] as const).map((id) => (
          <Link
            key={id}
            href={businessRoutes.manageTab(kind, id)}
            className={[
              'rounded-pill border px-3 py-1 text-body-sm',
              tab === id
                ? 'border-border bg-surface-alt font-weight-label text-heading'
                : 'border-transparent text-fg-secondary',
            ].join(' ')}
          >
            {t(`business_offers_tab_${id}`)}
          </Link>
        ))}
      </div>

      {tab === 'drafts' ? (
        kindDrafts.length === 0 ? (
          <BusinessEmptyState
            title={t('business_offers_drafts_empty_title')}
            description={t('business_offers_drafts_empty_body')}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {kindDrafts.map((draft) => (
                <li
                  key={draft.draftId}
                  className="rounded-card border border-border bg-surface p-card-padding shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-body font-weight-strong text-heading">
                        {(draft.fields as { name?: string }).name ||
                          t('business_draft_untitled')}
                      </p>
                      <p className="text-caption text-fg-secondary">
                        {t('business_last_edited')}{' '}
                        {new Date(draft.lastUpdated * 1000).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href={businessRoutes.offerDraft(kind, draft.draftId)}
                      className="rounded-btn border border-border px-3 py-1 text-body-sm text-link"
                    >
                      {t('business_continue_editing')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <div ref={draftsSentinelRef} className="h-4" aria-hidden />
          </>
        )
      ) : null}

      {tab === 'published' || tab === 'retired' ? (
        publishedRows.length === 0 ? (
          <BusinessEmptyState
            title={t('business_offers_published_empty_title')}
            description={t('business_offers_published_empty_body')}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {publishedRows.map((offer) => (
                <li
                  key={`${offer.offer_id}-${offer.version}`}
                  className="rounded-card border border-border bg-surface p-card-padding shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-body font-weight-strong text-heading">
                        {offer.name}
                      </p>
                      <p className="text-caption text-fg-secondary">v{offer.version}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StateBadge
                        variant={offer.status === 'active' ? 'confirmed' : 'retired'}
                      />
                      <Link
                        href={businessRoutes.offerDetail(offer.offer_id)}
                        className="rounded-btn border border-border px-3 py-1 text-body-sm text-link"
                      >
                        {t('business_view')}
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div ref={publishedSentinelRef} className="h-4" aria-hidden />
          </>
        )
      ) : null}
    </BusinessPageShell>
  );
}

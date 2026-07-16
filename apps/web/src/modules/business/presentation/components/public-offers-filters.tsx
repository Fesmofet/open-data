'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  buildPublicOffersHref,
  hasPublicOffersFilters,
  type PublicOffersPageState,
} from '../../domain/public-offers-url';

export type PublicOffersFiltersProps = {
  kind: 'offer' | 'request';
  filters: PublicOffersPageState;
};

export function PublicOffersFilters({ kind, filters }: PublicOffersFiltersProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [author, setAuthor] = useState(filters.author);
  const [q, setQ] = useState(filters.q);

  const otherKind = kind === 'offer' ? 'request' : 'offer';
  const otherHref = buildPublicOffersHref(otherKind, {
    author: filters.author || undefined,
    q: filters.q || undefined,
  });
  const hasFilters = hasPublicOffersFilters(filters);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(
      buildPublicOffersHref(kind, {
        author: author || undefined,
        q: q || undefined,
      }),
    );
  }

  function onClear() {
    setAuthor('');
    setQ('');
    router.push(buildPublicOffersHref(kind));
  }

  return (
    <div className="mb-section-y flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body-sm text-fg-secondary">
          {kind === 'offer'
            ? t('business_public_offers_title')
            : t('business_public_requests_title')}
        </span>
        <span className="text-caption text-fg-tertiary">·</span>
        <button
          type="button"
          onClick={() => router.push(otherHref)}
          className="text-body-sm text-link"
        >
          {otherKind === 'offer'
            ? t('business_view_offers')
            : t('business_view_requests')}
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-card border border-border bg-surface p-card-padding shadow-card sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
          <span className="text-caption font-weight-label text-fg-secondary">
            {t('business_public_filter_author')}
          </span>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t('business_public_filter_author_placeholder')}
            className="rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg"
            autoComplete="off"
          />
        </label>
        <label className="flex min-w-[12rem] flex-[2] flex-col gap-1">
          <span className="text-caption font-weight-label text-fg-secondary">
            {t('business_public_filter_q')}
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('business_public_filter_q_placeholder')}
            className="rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg"
            autoComplete="off"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg"
          >
            {t('business_public_filter_apply')}
          </button>
          {hasFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-btn border border-border px-4 py-2 text-body-sm text-fg-secondary"
            >
              {t('business_public_filter_clear')}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

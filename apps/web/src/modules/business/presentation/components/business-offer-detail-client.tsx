'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useOblCustomJsonId } from '@/config/odl-network-provider';

import {
  buildRetireOfferOp,
} from '../../application/build-obl-ops';
import { businessNavIdForKind, businessRoutes } from '../../domain/routes';
import type { OblOfferApiRow } from '../../infrastructure/clients/obl-offers.server';
import { createOblDraftAction } from '../../infrastructure/actions/obl-drafts.actions';
import { BusinessDisclosure } from './business-disclosure';
import { StateBadge } from './state-badge';
import { useOblBroadcast } from '../hooks/use-obl-broadcast';
import { BusinessPageShell } from '../layout/business-page-shell';

export function BusinessOfferDetailClient({
  username,
  offer,
}: {
  username: string;
  offer: OblOfferApiRow;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const oblCustomJsonId = useOblCustomJsonId();
  const { broadcast, phase, isBusy, error } = useOblBroadcast(username);
  const [newVersionErrorKey, setNewVersionErrorKey] = useState<string | null>(null);
  const isOwner = username === offer.author;
  const publicHref =
    offer.kind === 'offer'
      ? businessRoutes.publicOffer(offer.offer_id, offer.version)
      : businessRoutes.publicRequest(offer.offer_id, offer.version);

  async function onRetire() {
    const op = buildRetireOfferOp({
      oblCustomJsonId,
      author: username,
      offerId: offer.offer_id,
    });
    await broadcast([op]);
    router.refresh();
  }

  async function onNewVersion() {
    setNewVersionErrorKey(null);
    const draft = await createOblDraftAction(username, {
      kind: offer.kind,
      fields: {
        offerId: offer.offer_id,
        publishedOfferId: offer.offer_id,
        name: offer.name,
        description: offer.description ?? '',
        tags: offer.tags,
        serviceRef: offer.service_ref ?? undefined,
        legalRef: offer.legal_ref ?? undefined,
        terms: (offer.terms as Record<string, unknown>) ?? {},
        disputeRule: offer.dispute_rule,
        arbiter: offer.arbiter,
      },
    });
    if (draft.ok) {
      const draftId = draft.value.draftId?.trim();
      if (draftId) {
        router.push(businessRoutes.offerDraft(offer.kind, draftId));
        return;
      }
      setNewVersionErrorKey('business_draft_create_error_generic');
      return;
    }
    if (draft.error.code === 'unauthorized') {
      setNewVersionErrorKey('business_draft_create_error_unauthorized');
    } else {
      setNewVersionErrorKey('business_draft_create_error_generic');
    }
  }

  return (
    <BusinessPageShell
      activeNav={businessNavIdForKind(offer.kind)}
      title={offer.name}
      subtitle={t('business_offer_detail_subtitle')}
      actions={
        isOwner ? (
          <>
            {offer.status === 'active' ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void onRetire()}
                className="rounded-btn border border-border px-3 py-1 text-body-sm disabled:opacity-50"
              >
                {t('business_retire_offer')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void onNewVersion()}
              className="rounded-btn bg-accent px-3 py-1 text-body-sm text-accent-fg"
            >
              {t('business_new_version')}
            </button>
          </>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StateBadge
            variant={offer.status === 'active' ? 'confirmed' : 'retired'}
          />
          <span className="text-caption text-fg-secondary">
            {offer.kind} · v{offer.version}
          </span>
        </div>

        {offer.description ? (
          <p className="text-body text-fg">{offer.description}</p>
        ) : null}

        <BusinessDisclosure variant="immutable_version" />
        {offer.legal_ref ? <BusinessDisclosure variant="legal_ref_warning" /> : null}

        <div className="flex flex-wrap gap-3">
          <Link href={publicHref} className="text-body-sm text-link">
            {t('business_public_link')}
          </Link>
          <Link
            href={businessRoutes.offerVersion(offer.offer_id, offer.version)}
            className="text-body-sm text-link"
          >
            {t('business_versions')} v{offer.version}
          </Link>
        </div>

        {phase === 'indexing' ? <StateBadge variant="indexing" /> : null}
        {error ? <p className="text-body-sm text-error">{error}</p> : null}
        {newVersionErrorKey ? (
          <p className="text-body-sm text-error" role="alert">
            {t(newVersionErrorKey)}
          </p>
        ) : null}
      </div>
    </BusinessPageShell>
  );
}

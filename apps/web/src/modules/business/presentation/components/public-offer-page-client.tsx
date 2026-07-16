'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useOblCustomJsonId } from '@/config/odl-network-provider';

import { buildSignContractOp } from '../../application/build-obl-ops';
import { businessRoutes } from '../../domain/routes';
import type { OblOfferApiRow } from '../../infrastructure/clients/obl-offers.server';
import { BusinessDisclosure } from './business-disclosure';
import { StateBadge } from './state-badge';
import { useOblBroadcast } from '../hooks/use-obl-broadcast';

export type PublicOfferPageClientProps = {
  offer: OblOfferApiRow;
  viewer: string | null;
};

export function PublicOfferPageClient({ offer, viewer }: PublicOfferPageClientProps) {
  const { t } = useI18n();
  const oblCustomJsonId = useOblCustomJsonId();
  const counterparty = offer.author;
  const { broadcast, phase, error } = useOblBroadcast(viewer ?? '', counterparty);
  const [ack, setAck] = useState(false);

  const isAuthor = viewer === offer.author;
  const canSign =
    !isAuthor &&
    offer.status === 'active' &&
    viewer !== null &&
    ((offer.kind === 'offer' && viewer !== offer.author) ||
      (offer.kind === 'request' && viewer !== offer.author));

  async function onSign() {
    if (!viewer || !ack) {
      return;
    }
    const provider = offer.kind === 'offer' ? offer.author : viewer;
    const client = offer.kind === 'offer' ? viewer : offer.author;
    const signer = viewer;
    const op = buildSignContractOp({
      oblCustomJsonId,
      contractId: `contract-${offer.offer_id}-v${offer.version}-${Date.now()}`,
      offerId: offer.offer_id,
      offerVersion: offer.version,
      provider,
      client,
      signer,
    });
    await broadcast([op]);
  }

  return (
    <div className="mx-auto max-w-container-narrow px-gutter py-section-y">
      <header className="mb-section-y">
        <p className="text-caption text-fg-secondary">
          {offer.kind} · v{offer.version}
        </p>
        <h1 className="text-section font-display font-weight-display text-heading">
          {offer.name}
        </h1>
        <p className="mt-2 text-body text-fg-secondary">@{offer.author}</p>
        <div className="mt-2">
          <StateBadge variant={offer.status === 'active' ? 'confirmed' : 'retired'} />
        </div>
      </header>

      {offer.description ? (
        <p className="mb-6 text-body text-fg">{offer.description}</p>
      ) : null}

      {canSign ? (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-card-padding shadow-card">
          <BusinessDisclosure variant="ledger_start" />
          <BusinessDisclosure variant="auto_payments" />
          <label className="flex items-start gap-2 text-body-sm">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-1"
            />
            {t('business_sign_ack')}
          </label>
          {phase === 'indexing' ? <StateBadge variant="indexing" /> : null}
          {error ? <p className="text-body-sm text-error">{error}</p> : null}
          <button
            type="button"
            disabled={!ack}
            onClick={() => void onSign()}
            className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
          >
            {t('business_sign_contract')}
          </button>
          {viewer ? (
            <Link
              href={businessRoutes.relationship(counterparty)}
              className="text-body-sm text-link"
            >
              {t('business_view_relationship')}
            </Link>
          ) : null}
        </div>
      ) : null}

      {isAuthor ? (
        <Link
          href={businessRoutes.offerDetail(offer.offer_id)}
          className="text-body-sm text-link"
        >
          {t('business_manage_offer')}
        </Link>
      ) : null}
    </div>
  );
}

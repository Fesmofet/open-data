'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useOblCustomJsonId } from '@/config/odl-network-provider';

import { buildSignContractOp } from '../../application/build-obl-ops';
import { deterministicContractId } from '../../domain/obl-ids';
import {
  buildMetadataFromSignValues,
  missingRequiredSignParams,
  parseMetadataJson,
  parseOfferTerms,
} from '../../domain/offer-terms';
import { businessRoutes } from '../../domain/routes';
import type { OblOfferApiRow } from '../../infrastructure/clients/obl-offers.server';
import { BusinessDisclosure } from './business-disclosure';
import { StateBadge } from './state-badge';
import { useOblBroadcast } from '../hooks/use-obl-broadcast';

export type PublicOfferPageClientProps = {
  offer: OblOfferApiRow;
  viewer: string | null;
  alreadySigned?: boolean;
};

export function PublicOfferPageClient({
  offer,
  viewer,
  alreadySigned = false,
}: PublicOfferPageClientProps) {
  const { t } = useI18n();
  const oblCustomJsonId = useOblCustomJsonId();
  const counterparty = offer.author;
  const { broadcast, phase, isBusy, error } = useOblBroadcast(viewer ?? '', counterparty);
  const [ack, setAck] = useState(false);
  const [metadataJson, setMetadataJson] = useState('{}');
  const [metadataJsonError, setMetadataJsonError] = useState<string | null>(null);
  const [signValues, setSignValues] = useState<Record<string, string>>({});

  const parsedTerms = useMemo(() => parseOfferTerms(offer.terms), [offer.terms]);
  const signParams = parsedTerms.signParams;
  const useGuidedForm = signParams.length > 0;

  const isAuthor = viewer === offer.author;
  const canSign =
    !alreadySigned &&
    !isAuthor &&
    offer.status === 'active' &&
    viewer !== null &&
    ((offer.kind === 'offer' && viewer !== offer.author) ||
      (offer.kind === 'request' && viewer !== offer.author));

  const missingRequired = useGuidedForm
    ? missingRequiredSignParams(signParams, signValues)
    : [];

  const canSubmitSign =
    ack &&
    (useGuidedForm
      ? missingRequired.length === 0
      : metadataJsonError === null && parseMetadataJson(metadataJson) !== null);

  async function onSign() {
    if (!viewer || !ack) {
      return;
    }
    const provider = offer.kind === 'offer' ? offer.author : viewer;
    const client = offer.kind === 'offer' ? viewer : offer.author;
    const signer = viewer;

    let metadata: Record<string, unknown> | undefined;
    if (useGuidedForm) {
      metadata = buildMetadataFromSignValues(signParams, signValues);
    } else {
      const parsed = parseMetadataJson(metadataJson);
      if (parsed === null) {
        setMetadataJsonError(t('business_sign_metadata_invalid_json'));
        return;
      }
      metadata = Object.keys(parsed).length > 0 ? parsed : undefined;
    }

    const op = buildSignContractOp({
      oblCustomJsonId,
      contractId: deterministicContractId(offer.offer_id, provider, client),
      offerId: offer.offer_id,
      offerVersion: offer.version,
      provider,
      client,
      signer,
      metadata,
    });
    await broadcast([op]);
  }

  function onMetadataJsonChange(value: string) {
    setMetadataJson(value);
    if (value.trim().length === 0) {
      setMetadataJsonError(null);
      return;
    }
    setMetadataJsonError(
      parseMetadataJson(value) === null ? t('business_sign_metadata_invalid_json') : null,
    );
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

      {alreadySigned && viewer ? (
        <div className="mb-6 rounded-card border border-border bg-surface p-card-padding shadow-card">
          <p className="text-body-sm text-fg">{t('business_contract_already_signed')}</p>
          <Link
            href={businessRoutes.relationship(counterparty)}
            className="mt-2 inline-block text-body-sm text-link"
          >
            {t('business_view_relationship')}
          </Link>
        </div>
      ) : null}

      {canSign ? (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-card-padding shadow-card">
          <BusinessDisclosure variant="ledger_start" />
          <BusinessDisclosure variant="auto_payments" />
          <BusinessDisclosure variant="sign_metadata_hint" />

          {useGuidedForm ? (
            <div className="flex flex-col gap-3">
              <p className="text-body-sm font-weight-label text-heading">
                {t('business_sign_params_title')}
              </p>
              {signParams.map((param) => (
                <label key={param.key} className="flex flex-col gap-1 text-body-sm">
                  <span>
                    {param.label}
                    {param.required ? (
                      <span className="text-error"> *</span>
                    ) : null}
                  </span>
                  <input
                    type="text"
                    value={signValues[param.key] ?? ''}
                    onChange={(e) =>
                      setSignValues((prev) => ({ ...prev, [param.key]: e.target.value }))
                    }
                    className="rounded-btn border border-border px-3 py-2"
                  />
                </label>
              ))}
              {missingRequired.length > 0 ? (
                <p className="text-caption text-error">
                  {t('business_sign_params_required_missing')}
                </p>
              ) : null}
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-body-sm">
              {t('business_sign_metadata_label')}
              <textarea
                value={metadataJson}
                onChange={(e) => onMetadataJsonChange(e.target.value)}
                rows={5}
                className="rounded-btn border border-border px-3 py-2 font-mono text-caption"
                placeholder='{"targets":["obj-1"],"governance":"gov-1"}'
              />
              {metadataJsonError ? (
                <span className="text-caption text-error">{metadataJsonError}</span>
              ) : null}
            </label>
          )}

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
            disabled={!canSubmitSign || isBusy}
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

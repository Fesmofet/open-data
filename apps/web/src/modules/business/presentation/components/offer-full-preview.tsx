'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  formatTagsInput,
  getOfferTerms,
  type OfferDraftState,
} from '../../domain/offer-form.types';
import { BusinessDisclosure } from './business-disclosure';

export type OfferFullPreviewProps = {
  state: OfferDraftState;
  author?: string;
};

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <dt className="text-caption text-fg-secondary">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-body text-fg">{value}</dd>
    </div>
  );
}

function displayOrDash(value: string | undefined | null): string {
  const t = value?.trim() ?? '';
  return t.length > 0 ? t : '—';
}

export function OfferFullPreview({ state, author }: OfferFullPreviewProps) {
  const { t } = useI18n();
  const { kind, fields, legalText } = state;
  const terms = getOfferTerms(fields);

  return (
    <article className="flex flex-col gap-6">
      <header>
        <p className="text-caption text-fg-secondary">
          {kind}
          {author ? ` · @${author}` : ''}
        </p>
        <h2 className="text-section font-display font-weight-display text-heading">
          {displayOrDash(fields.name)}
        </h2>
      </header>

      <BusinessDisclosure variant="immutable_version" />
      {(fields.legalRef?.trim() || legalText.trim()) ? (
        <BusinessDisclosure variant="legal_ref_warning" />
      ) : null}

      <section>
        <h3 className="mb-2 text-body font-weight-strong text-heading">
          {t('business_editor_step_basics')}
        </h3>
        <dl>
          <PreviewRow label={t('business_field_kind')} value={kind} />
          <PreviewRow label={t('business_field_name')} value={displayOrDash(fields.name)} />
          <PreviewRow
            label={t('business_field_description')}
            value={displayOrDash(fields.description)}
          />
          <PreviewRow
            label={t('business_field_tags')}
            value={displayOrDash(formatTagsInput(fields.tags))}
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-body font-weight-strong text-heading">
          {t('business_editor_step_service')}
        </h3>
        <dl>
          <PreviewRow
            label={t('business_field_service_ref')}
            value={displayOrDash(fields.serviceRef)}
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-body font-weight-strong text-heading">
          {t('business_editor_step_commercial')}
        </h3>
        <dl>
          <PreviewRow
            label={t('business_field_pricing_model')}
            value={displayOrDash(terms.pricingModel)}
          />
          <PreviewRow
            label={t('business_field_amount_usd')}
            value={displayOrDash(terms.amountUsd)}
          />
          <PreviewRow
            label={t('business_field_currency')}
            value={displayOrDash(terms.currency)}
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-body font-weight-strong text-heading">
          {t('business_editor_step_billing')}
        </h3>
        <dl>
          <PreviewRow
            label={t('business_field_billing_cycle')}
            value={displayOrDash(terms.billingCycle)}
          />
          <PreviewRow
            label={t('business_field_billing_notes')}
            value={displayOrDash(fields.billingNotes)}
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-body font-weight-strong text-heading">
          {t('business_editor_step_termination')}
        </h3>
        <dl>
          <PreviewRow
            label={t('business_field_termination_notes')}
            value={displayOrDash(fields.terminationNotes)}
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-body font-weight-strong text-heading">
          {t('business_editor_step_disputes')}
        </h3>
        <dl>
          <PreviewRow
            label={t('business_field_dispute_rule')}
            value={displayOrDash(fields.disputeRule)}
          />
          {fields.disputeRule === 'arbiter' ? (
            <PreviewRow
              label={t('business_field_arbiter')}
              value={displayOrDash(fields.arbiter)}
            />
          ) : null}
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-body font-weight-strong text-heading">
          {t('business_editor_step_legal')}
        </h3>
        <dl>
          <PreviewRow
            label={t('business_field_legal_ref')}
            value={displayOrDash(fields.legalRef)}
          />
          <PreviewRow
            label={t('business_field_legal_text')}
            value={displayOrDash(legalText)}
          />
        </dl>
      </section>
    </article>
  );
}

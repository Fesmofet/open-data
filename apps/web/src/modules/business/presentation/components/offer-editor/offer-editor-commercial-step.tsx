'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { isOblUsdAmount } from '@opden-data-layer/core/utils/obl-usd-amount';

import {
  getOfferTerms,
  type OfferDraftFields,
  type OfferTerms,
} from '../../../domain/offer-form.types';
import { offerEditorFieldClass, offerEditorLabelClass } from './offer-editor-field-styles';

export type OfferEditorCommercialStepProps = {
  fields: OfferDraftFields;
  onFieldsChange: (fields: OfferDraftFields) => void;
};

function mergeTerms(fields: OfferDraftFields, patch: Partial<OfferTerms>): OfferDraftFields {
  return { ...fields, terms: { ...getOfferTerms(fields), ...patch } };
}

export function OfferEditorCommercialStep({
  fields,
  onFieldsChange,
}: OfferEditorCommercialStepProps) {
  const { t } = useI18n();
  const terms = getOfferTerms(fields);
  const amountUsd = terms.amountUsd ?? '';
  const amountUsdInvalid =
    amountUsd.trim() !== '' && !isOblUsdAmount(amountUsd, 'positive');

  return (
    <div className="flex flex-col gap-4">
      <label className={offerEditorLabelClass}>
        {t('business_field_pricing_model')}
        <select
          value={terms.pricingModel ?? 'custom'}
          onChange={(e) =>
            onFieldsChange(
              mergeTerms(fields, {
                pricingModel: e.target.value as OfferTerms['pricingModel'],
              }),
            )
          }
          className={offerEditorFieldClass}
        >
          <option value="fixed">{t('business_pricing_fixed')}</option>
          <option value="hourly">{t('business_pricing_hourly')}</option>
          <option value="custom">{t('business_pricing_custom')}</option>
        </select>
      </label>
      <label className={offerEditorLabelClass}>
        {t('business_field_amount_usd')}
        <input
          type="text"
          inputMode="decimal"
          value={amountUsd}
          onChange={(e) => onFieldsChange(mergeTerms(fields, { amountUsd: e.target.value }))}
          aria-invalid={amountUsdInvalid}
          className={[
            offerEditorFieldClass,
            amountUsdInvalid ? 'border-danger text-danger' : '',
          ].join(' ')}
        />
        {amountUsdInvalid ? (
          <span className="text-caption text-danger">{t('business_field_amount_usd_invalid')}</span>
        ) : null}
      </label>
      <label className={offerEditorLabelClass}>
        {t('business_field_currency')}
        <input
          value={terms.currency ?? 'USD'}
          onChange={(e) => onFieldsChange(mergeTerms(fields, { currency: e.target.value }))}
          className={offerEditorFieldClass}
        />
      </label>
    </div>
  );
}

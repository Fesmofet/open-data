'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { OfferDraftFields } from '../../../domain/offer-form.types';
import { offerEditorFieldClass, offerEditorLabelClass } from './offer-editor-field-styles';

export type OfferEditorDisputesStepProps = {
  fields: OfferDraftFields;
  onFieldsChange: (fields: OfferDraftFields) => void;
};

export function OfferEditorDisputesStep({
  fields,
  onFieldsChange,
}: OfferEditorDisputesStepProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <label className={offerEditorLabelClass}>
        {t('business_field_dispute_rule')}
        <select
          value={fields.disputeRule ?? 'client'}
          onChange={(e) =>
            onFieldsChange({
              ...fields,
              disputeRule: e.target.value as OfferDraftFields['disputeRule'],
            })
          }
          className={offerEditorFieldClass}
        >
          <option value="client">{t('business_dispute_client')}</option>
          <option value="provider">{t('business_dispute_provider')}</option>
          <option value="arbiter">{t('business_dispute_arbiter')}</option>
        </select>
      </label>
      {fields.disputeRule === 'arbiter' ? (
        <label className={offerEditorLabelClass}>
          {t('business_field_arbiter')}
          <input
            value={fields.arbiter ?? ''}
            onChange={(e) => onFieldsChange({ ...fields, arbiter: e.target.value })}
            className={offerEditorFieldClass}
          />
        </label>
      ) : null}
    </div>
  );
}

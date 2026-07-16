'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  getOfferTerms,
  type OfferDraftFields,
} from '../../../domain/offer-form.types';
import { offerEditorFieldClass, offerEditorLabelClass } from './offer-editor-field-styles';

export type OfferEditorBillingStepProps = {
  fields: OfferDraftFields;
  onFieldsChange: (fields: OfferDraftFields) => void;
};

export function OfferEditorBillingStep({
  fields,
  onFieldsChange,
}: OfferEditorBillingStepProps) {
  const { t } = useI18n();
  const terms = getOfferTerms(fields);

  return (
    <div className="flex flex-col gap-4">
      <label className={offerEditorLabelClass}>
        {t('business_field_billing_cycle')}
        <input
          value={terms.billingCycle ?? ''}
          onChange={(e) =>
            onFieldsChange({
              ...fields,
              terms: { ...terms, billingCycle: e.target.value },
            })
          }
          placeholder={t('business_field_billing_cycle_hint')}
          className={offerEditorFieldClass}
        />
      </label>
      <label className={offerEditorLabelClass}>
        {t('business_field_billing_notes')}
        <textarea
          value={fields.billingNotes ?? ''}
          onChange={(e) => onFieldsChange({ ...fields, billingNotes: e.target.value })}
          rows={5}
          className={offerEditorFieldClass}
        />
      </label>
    </div>
  );
}

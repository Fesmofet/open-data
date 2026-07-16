'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserRefSearchField } from '@/modules/object-updates/presentation/components/user-ref-search-field';

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
  const disputeRule = fields.disputeRule ?? 'client';

  return (
    <div className="flex flex-col gap-4">
      <label className={offerEditorLabelClass}>
        {t('business_field_dispute_rule')}
        <select
          value={disputeRule}
          onChange={(e) => {
            const nextRule = e.target.value as OfferDraftFields['disputeRule'];
            onFieldsChange({
              ...fields,
              disputeRule: nextRule,
              arbiter: nextRule === 'arbiter' ? fields.arbiter : null,
            });
          }}
          className={offerEditorFieldClass}
        >
          <option value="client">{t('business_dispute_client')}</option>
          <option value="provider">{t('business_dispute_provider')}</option>
          <option value="arbiter">{t('business_dispute_arbiter')}</option>
        </select>
      </label>
      {disputeRule === 'arbiter' ? (
        <UserRefSearchField
          label={t('business_field_arbiter')}
          value={fields.arbiter ?? ''}
          onChange={(accountName) =>
            onFieldsChange({
              ...fields,
              arbiter: accountName.trim() !== '' ? accountName : null,
            })
          }
          fieldLabel={t('business_field_arbiter')}
        />
      ) : null}
    </div>
  );
}

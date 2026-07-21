'use client';

import { useEffect, useMemo } from 'react';

import { UPDATE_REGISTRY } from '@opden-data-layer/core/update-registry';
import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { objectStatusLabelKey } from '@/modules/object/domain/object-status-label';

import {
  parseStatusFormValue,
  STATUS_FORM_SELECTABLE_VALUES,
  type SelectableStatusValue,
} from '../../application/status-form-value';
import { validateUpdateValue } from '../../application/update-value-form.utils';
import { ObjectRefSearchField } from './object-ref-search-field';

export type StatusUpdateFormProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  onValidityChange?: (valid: boolean) => void;
  hideLegend?: boolean;
  label?: string;
  /** Current object id — excluded from relisted target picker. */
  excludeObjectId?: string;
  /** Registry object type for type-dependent status labels (e.g. closed). */
  objectType?: string;
};

export function StatusUpdateForm({
  value,
  onChange,
  onValidityChange,
  hideLegend = false,
  label,
  excludeObjectId,
  objectType,
}: StatusUpdateFormProps) {
  const { t } = useI18n();
  const definition = UPDATE_REGISTRY[UPDATE_TYPES.STATUS];
  const parsed = useMemo(() => parseStatusFormValue(value), [value]);
  const { title, link = '' } = parsed;

  useEffect(() => {
    if (!onValidityChange || !definition) {
      return;
    }
    const payload =
      title === 'relisted' ? { title, link } : { title };
    const result = validateUpdateValue(definition, payload);
    onValidityChange(result.success);
  }, [definition, title, link, onValidityChange]);

  const handleTitleChange = (nextTitle: SelectableStatusValue) => {
    if (nextTitle === 'relisted') {
      onChange({ title: nextTitle, link });
      return;
    }
    onChange({ title: nextTitle });
  };

  const categoryLabel = t('object_edit_status_category');
  const relistedObjectLabel = t('object_edit_status_relisted_object');

  return (
    <fieldset className="space-y-3 text-body-sm">
      {label && !hideLegend ? (
        <legend className="font-weight-label text-fg">{label}</legend>
      ) : (
        <legend className="sr-only">{t('status')}</legend>
      )}
      <label className="block">
        <span className="text-muted">{categoryLabel} *</span>
        <select
          className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value as SelectableStatusValue)}
        >
          {STATUS_FORM_SELECTABLE_VALUES.map((opt) => (
            <option key={opt} value={opt}>
              {t(objectStatusLabelKey(opt, objectType))}
            </option>
          ))}
        </select>
      </label>
      {title === 'relisted' ? (
        <ObjectRefSearchField
          label={relistedObjectLabel}
          fieldLabel={relistedObjectLabel}
          updateType={UPDATE_TYPES.STATUS}
          value={link}
          excludeObjectIds={excludeObjectId ? [excludeObjectId] : []}
          onChange={(objectId) => onChange({ title, link: objectId })}
        />
      ) : null}
    </fieldset>
  );
}

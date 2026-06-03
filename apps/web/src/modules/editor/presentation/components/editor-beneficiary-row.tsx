'use client';

import type { CSSProperties } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { beneficiaryWeightToPercent } from '../../application/post-editor-advanced-settings';
import {
  HIVE_BENEFICIARY_WEIGHT_MIN,
  HIVE_BENEFICIARY_WEIGHT_TOTAL,
} from '../../domain/post-editor-advanced-settings';
import type { PostEditorBeneficiary } from '../../domain/post-editor-advanced-settings';

export type EditorBeneficiaryRowProps = {
  beneficiary: PostEditorBeneficiary;
  onWeightChange: (weight: number) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function EditorBeneficiaryRow({
  beneficiary,
  onWeightChange,
  onRemove,
  canRemove,
}: EditorBeneficiaryRowProps) {
  const { t } = useI18n();
  const displayPercent = beneficiaryWeightToPercent(beneficiary.weight);
  const fillPercent = (beneficiary.weight / HIVE_BENEFICIARY_WEIGHT_TOTAL) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-label text-body-sm text-fg">
          {beneficiary.account}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-caption tabular-nums text-fg-secondary">
            {displayPercent}%
          </span>
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-caption text-muted hover:text-accent"
              aria-label={t('remove')}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
      <label className="sr-only" htmlFor={`beneficiary-${beneficiary.account}`}>
        {t('beneficiary_percent')}
      </label>
      <input
        id={`beneficiary-${beneficiary.account}`}
        type="range"
        min={HIVE_BENEFICIARY_WEIGHT_MIN}
        max={HIVE_BENEFICIARY_WEIGHT_TOTAL}
        step={100}
        value={beneficiary.weight}
        className="editor-linked-object-percent-slider w-full"
        style={
          {
            '--slider-fill': `${fillPercent}%`,
          } as CSSProperties
        }
        onChange={(e) => onWeightChange(Number(e.target.value))}
      />
    </div>
  );
}

'use client';

import { useCallback, useId, useState } from 'react';

import { UserRefSearchField } from '@/modules/object-updates/presentation/components/user-ref-search-field';
import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  addPostEditorTag,
  appendBeneficiaryIfAbsent,
  applyBeneficiaryWeight,
  authorBeneficiaryRemainderWeight,
  beneficiaryWeightToPercent,
  canAddPostEditorTag,
  removePostEditorTag,
  validateBeneficiaries,
} from '../../application/post-editor-advanced-settings';
import {
  HIVE_BENEFICIARY_WEIGHT_MIN,
  type PostEditorBeneficiary,
  type PostEditorRewardMode,
} from '../../domain/post-editor-advanced-settings';
import { EditorBeneficiaryRow } from './editor-beneficiary-row';

const REWARD_MODES: readonly PostEditorRewardMode[] = [
  'fifty_fifty',
  'hive_power',
  'declined',
];

const REWARD_MODE_I18N: Record<PostEditorRewardMode, string> = {
  fifty_fifty: 'reward_option_50',
  hive_power: 'reward_option_100',
  declined: 'reward_option_0',
};

export type EditorAdvancedSettingsPanelProps = {
  username: string;
  rewardMode: PostEditorRewardMode;
  onRewardModeChange: (mode: PostEditorRewardMode) => void;
  beneficiaries: readonly PostEditorBeneficiary[];
  onBeneficiariesChange: (next: PostEditorBeneficiary[]) => void;
  tags: readonly string[];
  onTagsChange: (next: string[]) => void;
};

export function EditorAdvancedSettingsPanel({
  username,
  rewardMode,
  onRewardModeChange,
  beneficiaries,
  onBeneficiariesChange,
  tags,
  onTagsChange,
}: EditorAdvancedSettingsPanelProps) {
  const { t } = useI18n();
  const headingId = useId();
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  const beneficiaryValidation = validateBeneficiaries(beneficiaries, username);
  const authorRemainderPercent = beneficiaryWeightToPercent(
    authorBeneficiaryRemainderWeight(beneficiaries),
  );

  const commitTagInput = useCallback(() => {
    const raw = tagInput.trim();
    if (!raw) {
      return;
    }
    if (!canAddPostEditorTag(tags, raw)) {
      setTagError(
        t('hashtags_error_invalid_hashtag').replace('{hashtag}', raw),
      );
      return;
    }
    setTagError(null);
    onTagsChange(addPostEditorTag(tags, raw));
    setTagInput('');
  }, [onTagsChange, tagInput, tags, t]);

  const handleBeneficiarySelect = useCallback(
    (accountName: string) => {
      const { beneficiaries: next, added } = appendBeneficiaryIfAbsent(
        beneficiaries,
        accountName,
        HIVE_BENEFICIARY_WEIGHT_MIN,
      );
      if (added && validateBeneficiaries(next, username).ok) {
        onBeneficiariesChange(next);
      }
    },
    [beneficiaries, onBeneficiariesChange, username],
  );

  return (
    <details className="group rounded-card border-[0.5px] border-border bg-surface-control/40">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 px-card-padding py-3 font-label text-body-sm font-weight-label text-heading [&::-webkit-details-marker]:hidden"
        aria-labelledby={headingId}
      >
        <span
          className="inline-block size-0 shrink-0 border-y-4 border-s-4 border-y-transparent border-s-fg-secondary transition-transform group-open:rotate-90"
          aria-hidden
        />
        <span id={headingId}>{t('editor_advanced_settings')}</span>
      </summary>

      <div className="flex flex-col gap-4 border-t border-border px-card-padding pb-card-padding pt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label
            htmlFor="editor-reward-mode"
            className="shrink-0 font-label text-body-sm text-fg-secondary"
          >
            {t('reward')}
          </label>
          <select
            id="editor-reward-mode"
            value={rewardMode}
            onChange={(e) =>
              onRewardModeChange(e.target.value as PostEditorRewardMode)
            }
            className="w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:max-w-md"
          >
            {REWARD_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(REWARD_MODE_I18N[mode])}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-label text-body-sm font-weight-label text-heading">
            {t('beneficiaries')}
          </p>
          <UserRefSearchField
            value=""
            onChange={handleBeneficiarySelect}
            excludeAccountNames={[
              username,
              ...beneficiaries.map((b) => b.account),
            ]}
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 text-body-sm text-fg-secondary">
              <span className="truncate">{username}</span>
              <span className="tabular-nums">{authorRemainderPercent}%</span>
            </div>
            {beneficiaries.map((b) => (
              <EditorBeneficiaryRow
                key={b.account}
                beneficiary={b}
                canRemove
                onRemove={() => {
                  const next = beneficiaries.filter(
                    (x) => x.account !== b.account,
                  );
                  onBeneficiariesChange(next);
                }}
                onWeightChange={(weight) => {
                  const next = applyBeneficiaryWeight(
                    beneficiaries,
                    b.account,
                    weight,
                  );
                  if (validateBeneficiaries(next, username).ok) {
                    onBeneficiariesChange(next);
                  }
                }}
              />
            ))}
          </div>
          {!beneficiaryValidation.ok ? (
            <p className="text-body-sm text-warning" role="status">
              {t('beneficiary_error')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="editor-hashtags-input"
            className="font-label text-body-sm font-weight-label text-heading"
          >
            {t('hashtags')}
          </label>
          <div
            className={[
              'flex min-h-[2.75rem] flex-wrap items-center gap-2 rounded-btn border px-3 py-2',
              'border-border bg-surface focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
            ].join(' ')}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-pill border border-border bg-ghost-surface px-2.5 py-1 text-body-sm text-fg"
              >
                #{tag}
                <button
                  type="button"
                  className="text-caption text-muted hover:text-accent"
                  aria-label={t('remove')}
                  onClick={() => onTagsChange(removePostEditorTag(tags, tag))}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="editor-hashtags-input"
              type="text"
              value={tagInput}
              placeholder={t('hashtag_value_placeholder')}
              className="min-w-[8rem] flex-1 border-0 bg-transparent text-body-sm text-fg outline-none placeholder:text-fg-tertiary"
              onChange={(e) => {
                setTagInput(e.target.value);
                setTagError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  commitTagInput();
                }
              }}
              onBlur={() => commitTagInput()}
            />
          </div>
          <p className="text-caption text-fg-secondary">{t('hashtags_extra')}</p>
          <p className="text-caption text-fg-secondary">{t('hashtag_waivio')}</p>
          {tagError ? (
            <p className="text-body-sm text-warning" role="alert">
              {tagError}
            </p>
          ) : null}
        </div>
      </div>
    </details>
  );
}

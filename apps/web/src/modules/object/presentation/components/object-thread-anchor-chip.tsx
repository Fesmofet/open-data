'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { DISCOVER_ACTIVE_CHIP_CLASS } from '@/modules/discover/presentation/components/discover-active-chips';

export type ObjectThreadAnchorChipProps = {
  objectName: string;
};

export function ObjectThreadAnchorChip({ objectName }: ObjectThreadAnchorChipProps) {
  const { t } = useI18n();
  const displayName = objectName.trim() || t('object');

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-caption font-weight-label text-fg-tertiary">
        {t('object_thread_posting_in')}
      </span>
      <span className={DISCOVER_ACTIVE_CHIP_CLASS} aria-label={displayName}>
        <span className="max-w-[14rem] truncate">{displayName}</span>
      </span>
    </div>
  );
}

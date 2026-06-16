'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatUpdateCountLabel } from '@/modules/object/domain/update-count-label';

export type LeftRailUpdateCountBadgeProps = {
  count: number;
  /** When set, the count becomes a button that opens the updates feed for this field. */
  onClick?: () => void;
  /** Field heading for the accessible label when clickable. */
  fieldLabel?: string;
};

/** Muted line under a left-rail field heading — update count, not part of the title. */
export function LeftRailUpdateCountBadge({
  count,
  onClick,
  fieldLabel,
}: LeftRailUpdateCountBadgeProps) {
  const { t } = useI18n();
  const label = formatUpdateCountLabel(count, t);

  if (!onClick) {
    return (
      <p className="text-caption leading-body text-muted tabular-nums" aria-label={label}>
        {label}
      </p>
    );
  }

  const ariaLabel = fieldLabel
    ? t('object_edit_view_field_updates').replace('{field}', fieldLabel)
    : label;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-caption leading-body text-muted tabular-nums transition-colors hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}

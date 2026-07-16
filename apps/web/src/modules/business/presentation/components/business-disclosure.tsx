'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

export type BusinessDisclosureVariant =
  | 'ledger_start'
  | 'auto_payments'
  | 'legal_ref_warning'
  | 'immutable_version';

const KEYS: Record<BusinessDisclosureVariant, string> = {
  ledger_start: 'business_disclosure_ledger',
  auto_payments: 'business_disclosure_auto_payments',
  legal_ref_warning: 'business_disclosure_legal_ref',
  immutable_version: 'business_disclosure_immutable',
};

export function BusinessDisclosure({ variant }: { variant: BusinessDisclosureVariant }) {
  const { t } = useI18n();
  return (
    <aside
      className="rounded-card border border-border bg-surface-alt p-card-padding text-body-sm text-fg-secondary"
      role="note"
    >
      {t(KEYS[variant])}
    </aside>
  );
}

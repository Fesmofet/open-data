'use client';

import type { SupportedCurrency } from '@opden-data-layer/core/constants';
import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core/constants';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { HiveAdvancedReportAccountsField } from './hive-advanced-report-accounts-field';

export type AdvancedReportFiltersState = {
  startDate: string;
  endDate: string;
  filterAccounts: string[];
  currency: SupportedCurrency;
};

type HiveAdvancedReportFiltersProps = {
  value: AdvancedReportFiltersState;
  onChange: (next: AdvancedReportFiltersState) => void;
  onSubmit: () => void;
  submitting?: boolean;
  accountsError?: boolean;
};

export function HiveAdvancedReportFilters({
  value,
  onChange,
  onSubmit,
  submitting = false,
  accountsError = false,
}: HiveAdvancedReportFiltersProps) {
  const { t } = useI18n();

  return (
    <form
      className="mb-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <HiveAdvancedReportAccountsField
        accounts={value.filterAccounts}
        onChange={(filterAccounts) => onChange({ ...value, filterAccounts })}
      />
      {accountsError ? (
        <p className="text-body-sm text-danger">{t('find_users_placeholder')}</p>
      ) : null}
      <p className="text-body-sm text-muted">{t('multiple_accounts_included')}</p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-body-sm">
          <span>{t('table_date_from')}</span>
          <input
            type="date"
            className="rounded-input border border-border bg-bg px-2 py-1.5"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-body-sm">
          <span>{t('table_date_till')}</span>
          <input
            type="date"
            className="rounded-input border border-border bg-bg px-2 py-1.5"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-body-sm">
          <span>{t('base_currency')}</span>
          <select
            className="rounded-input border border-border bg-bg px-2 py-1.5"
            value={value.currency}
            onChange={(e) =>
              onChange({ ...value, currency: e.target.value as SupportedCurrency })
            }
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-button bg-accent px-5 py-2 text-body-sm font-weight-strong text-accent-fg disabled:opacity-60"
          disabled={submitting}
        >
          {t('submit')}
        </button>
      </div>
    </form>
  );
}

export function ymdToUnixStart(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 1000);
}

export function ymdToUnixEnd(ymd: string): number {
  return ymdToUnixStart(ymd) + 86_399;
}

export function unixToYmd(unix: number): string {
  const d = new Date(unix * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

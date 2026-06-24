'use client';

import type { SupportedCurrency } from '@opden-data-layer/core/constants';
import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core/constants';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { AdvancedReportDateRangeError } from '../../../../domain/advanced-report-date-range';
import { HiveAdvancedReportAccountsField } from './hive-advanced-report-accounts-field';

export type { AdvancedReportDateRangeError } from '../../../../domain/advanced-report-date-range';
export {
  maxAdvancedReportTillYmd,
  unixToYmd,
  validateAdvancedReportDateRange,
  ymdToUnixEnd,
  ymdToUnixStart,
} from '../../../../domain/advanced-report-date-range';

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
  onFromAccountCreation: () => void;
  submitting?: boolean;
  loadingCreation?: boolean;
  creationError?: boolean;
  accountsError?: boolean;
  dateRangeError?: AdvancedReportDateRangeError | null;
  maxTillDate: string;
};

export function HiveAdvancedReportFilters({
  value,
  onChange,
  onSubmit,
  onFromAccountCreation,
  submitting = false,
  loadingCreation = false,
  creationError = false,
  accountsError = false,
  dateRangeError = null,
  maxTillDate,
}: HiveAdvancedReportFiltersProps) {
  const { t } = useI18n();

  const dateRangeErrorMessage =
    dateRangeError === 'till_before_from'
      ? t('table_till_before_from_validation')
      : dateRangeError === 'till_in_future'
        ? t('table_after_till_validation')
        : null;

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

      <div className="space-y-1">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-body-sm">
            <span>{t('table_date_from')}</span>
            <input
              type="date"
              className="rounded-input border border-border bg-bg px-2 py-1.5"
              value={value.startDate}
              max={value.endDate || maxTillDate}
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
              min={value.startDate || undefined}
              max={maxTillDate}
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
        <div className="flex flex-col gap-1 text-body-sm">
          <button
            type="button"
            className="self-start text-link disabled:opacity-60"
            disabled={loadingCreation || submitting}
            onClick={onFromAccountCreation}
          >
            {loadingCreation ? t('activity_loading') : t('table_from_account_creation')}
          </button>
          {creationError ? (
            <p className="text-danger">{t('table_from_account_creation_failed')}</p>
          ) : null}
        </div>
      </div>
      {dateRangeErrorMessage ? (
        <p className="text-body-sm text-danger">{dateRangeErrorMessage}</p>
      ) : null}
    </form>
  );
}

'use client';

import { useCallback, useState } from 'react';

import type { SupportedCurrency } from '@opden-data-layer/core/constants';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { WaivGeneratedReportSummaryApi } from '../../../../../application/dto/waiv-generated-report-api.schema';
import { defaultAdvancedReportDateRange } from '../../../../../domain/advanced-report-defaults';
import {
  maxAdvancedReportTillYmd,
  unixToYmd,
  validateAdvancedReportDateRange,
  ymdToUnixEnd,
  ymdToUnixStart,
  type AdvancedReportDateRangeError,
} from '../../../../../domain/advanced-report-date-range';
import { createWaivGeneratedReportClient } from '../../../../../infrastructure/clients/waiv-generated-report.browser.client';
import { fetchHiveAccountCreatedDatesClient } from '../../../../../infrastructure/clients/hive-account-created-dates.browser.client';
import {
  WaivAdvancedReportFilters,
  type WaivAdvancedReportFiltersState,
} from '../waiv-advanced-report-filters';

type WaivGeneratedReportGenerateFormProps = {
  profileAccount: string;
  onCreated: (report: WaivGeneratedReportSummaryApi) => void;
};

export function WaivGeneratedReportGenerateForm({
  profileAccount,
  onCreated,
}: WaivGeneratedReportGenerateFormProps) {
  const { t } = useI18n();
  const defaults = defaultAdvancedReportDateRange();
  const [filters, setFilters] = useState<WaivAdvancedReportFiltersState>({
    startDate: unixToYmd(defaults.startDate),
    endDate: unixToYmd(defaults.endDate),
    filterAccounts: [profileAccount.trim().toLowerCase()],
    currency: 'USD' as SupportedCurrency,
    excludeSwapsAndTrades: true,
  });
  const [mergeRewards, setMergeRewards] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateRangeError, setDateRangeError] = useState<AdvancedReportDateRangeError | null>(
    null,
  );
  const [loadingCreation, setLoadingCreation] = useState(false);
  const [creationError, setCreationError] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const onSubmit = useCallback(async () => {
    const validation = validateAdvancedReportDateRange(filters.startDate, filters.endDate);
    if (validation) {
      setDateRangeError(validation);
      return;
    }
    setDateRangeError(null);
    setSubmitting(true);
    setSubmitError(false);
    const result = await createWaivGeneratedReportClient({
      profileAccount,
      filterAccounts: filters.filterAccounts,
      startDate: ymdToUnixStart(filters.startDate),
      endDate: ymdToUnixEnd(filters.endDate),
      currency: filters.currency,
      includeSwapsAndTrades: !filters.excludeSwapsAndTrades,
      mergeRewards,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(true);
      return;
    }
    onCreated(result.data);
  }, [filters, mergeRewards, onCreated, profileAccount]);

  const onFromAccountCreation = useCallback(() => {
    const accountNames =
      filters.filterAccounts.length > 0
        ? [...new Set(filters.filterAccounts.map((name) => name.trim().toLowerCase()))]
        : [profileAccount.trim().toLowerCase()];
    setCreationError(false);
    setLoadingCreation(true);
    void fetchHiveAccountCreatedDatesClient({ accounts: accountNames })
      .then((result) => {
        if (!result.ok || !result.data.startDateYmd) {
          setCreationError(true);
          return;
        }
        setFilters((prev) => ({
          ...prev,
          startDate: result.data.startDateYmd!,
        }));
        setDateRangeError(null);
      })
      .finally(() => {
        setLoadingCreation(false);
      });
  }, [filters.filterAccounts, profileAccount]);

  return (
    <div className="mb-6 space-y-3">
      <WaivAdvancedReportFilters
        value={filters}
        onChange={setFilters}
        onSubmit={() => void onSubmit()}
        onFromAccountCreation={onFromAccountCreation}
        submitting={submitting}
        loadingCreation={loadingCreation}
        creationError={creationError}
        dateRangeError={dateRangeError}
        maxTillDate={maxAdvancedReportTillYmd()}
      />
      <label className="flex items-center gap-2 text-body-sm">
        <input
          type="checkbox"
          className="accent-accent"
          checked={mergeRewards}
          onChange={(e) => setMergeRewards(e.target.checked)}
        />
        <span>{t('merge_rewards')}</span>
      </label>
      <button
        type="button"
        className="btn btn-primary"
        disabled={submitting}
        onClick={() => void onSubmit()}
      >
        {submitting ? t('activity_loading') : t('payments_generate_report')}
      </button>
      {submitError ? (
        <p className="text-body-sm text-danger">{t('unavailable')}</p>
      ) : null}
    </div>
  );
}

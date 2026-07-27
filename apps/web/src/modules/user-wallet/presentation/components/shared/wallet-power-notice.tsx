'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { PowerModalMode } from '../../../domain/wallet-power-labels';

export type WalletPowerNoticeProps = {
  mode: PowerModalMode;
};

export function WalletPowerNotice({ mode }: WalletPowerNoticeProps) {
  const { t } = useI18n();
  const leadKey =
    mode === 'up' ? 'power_up_modal_important_lead' : 'power_down_modal_important_lead';

  return (
    <div className="mt-4 text-body-sm text-muted">
      <h3 className="mb-2 font-weight-label text-fg">
        {t('payment_page_important')}:
      </h3>
      <p>{t(leadKey)}</p>
      <ul className="my-2 list-inside list-disc space-y-1">
        <li>{t('waiv_power_info')}</li>
        <li>{t('hive_power_info')}</li>
      </ul>
      <p>{t('power_up_or_down_info_part2')}</p>
    </div>
  );
}

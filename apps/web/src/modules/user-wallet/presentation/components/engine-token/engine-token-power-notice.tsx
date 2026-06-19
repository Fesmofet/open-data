'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

export function EngineTokenPowerNotice() {
  const { t } = useI18n();

  return (
    <div className="mt-4 text-body-sm text-muted">
      <h3 className="mb-2 font-weight-label text-fg">{t('notice')}:</h3>
      <p>{t('power_up_or_down_info_part1')}:</p>
      <ul className="my-2 list-inside list-disc space-y-1">
        <li>{t('waiv_power_info')}</li>
        <li>{t('hive_power_info')}</li>
      </ul>
      <p>{t('power_up_or_down_info_part2')}</p>
    </div>
  );
}

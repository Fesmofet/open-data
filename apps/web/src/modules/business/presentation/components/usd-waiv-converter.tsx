'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

export function UsdWaivConverter({ initialUsd = 100 }: { initialUsd?: number }) {
  const { t } = useI18n();
  const [amountUsd, setAmountUsd] = useState(initialUsd);
  const [rateUsd, setRateUsd] = useState<number | null>(null);
  const [amountWaiv, setAmountWaiv] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const res = await fetch(
        `/api/business/convert-usd-to-waiv?amountUsd=${encodeURIComponent(String(amountUsd))}`,
        { signal: controller.signal },
      );
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as {
        rateUsd: number | null;
        amountWaiv: number | null;
      };
      setRateUsd(data.rateUsd);
      setAmountWaiv(data.amountWaiv);
    })();
    return () => controller.abort();
  }, [amountUsd]);

  return (
    <div className="rounded-card border border-border bg-surface p-card-padding shadow-card">
      <h3 className="text-body font-weight-strong text-heading">
        {t('business_usd_waiv_title')}
      </h3>
      <label className="mt-3 flex flex-col gap-1 text-body-sm">
        USD
        <input
          type="number"
          min="0"
          step="0.01"
          value={amountUsd}
          onChange={(e) => setAmountUsd(Number(e.target.value))}
          className="rounded-btn border border-border bg-surface-control px-3 py-2 text-body"
        />
      </label>
      <p className="mt-3 text-body text-fg">
        {amountWaiv !== null ? `≈ ${amountWaiv.toFixed(8)} WAIV` : '—'}
      </p>
      <p className="mt-1 text-caption text-fg-tertiary">
        {rateUsd !== null
          ? `${t('business_usd_waiv_rate')}: ${rateUsd}`
          : t('business_usd_waiv_no_rate')}
      </p>
      <p className="mt-2 text-caption text-fg-secondary">
        {t('business_usd_waiv_disclaimer')}
      </p>
    </div>
  );
}

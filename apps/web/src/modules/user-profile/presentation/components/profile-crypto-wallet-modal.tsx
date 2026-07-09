'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import type { UserAccountSidebarCryptoWallet } from '../../domain/types/user-account-sidebar-view';
import { formatSidebarUsd } from '../utils/account-sidebar-format';

const CRYPTOCURRENCY_ICON_DIR = '/images/icons/cryptocurrencies';

function cryptoWalletIconSrc(icon: string): string {
  return `${CRYPTOCURRENCY_ICON_DIR}/${icon}`;
}

function cryptoWalletQrCodeUrl(value: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}

function buildCryptoQrPayload(wallet: UserAccountSidebarCryptoWallet, amount: string): string {
  const normalizedAmount = amount.trim();
  if (normalizedAmount.length === 0) {
    return wallet.address;
  }
  return `${wallet.shortName.toLowerCase()}:${wallet.address}?amount=${normalizedAmount}`;
}

type CryptoPricesResponse = {
  prices?: Record<string, number>;
};

export type ProfileCryptoWalletModalProps = {
  wallet: UserAccountSidebarCryptoWallet | null;
  open: boolean;
  onClose: () => void;
};

export function ProfileCryptoWalletModal({
  wallet,
  open,
  onClose,
}: ProfileCryptoWalletModalProps) {
  const { t, locale } = useI18n();
  const titleId = useId();
  const [amount, setAmount] = useState('');
  const [usdRates, setUsdRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) {
      setAmount('');
      return;
    }
    let cancelled = false;
    void fetch('/api/currency/crypto-prices')
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as CryptoPricesResponse;
      })
      .then((payload) => {
        if (cancelled || !payload?.prices) {
          return;
        }
        setUsdRates(payload.prices);
      })
      .catch(() => {
        if (!cancelled) {
          setUsdRates({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const qrPayload = useMemo(
    () => (wallet ? buildCryptoQrPayload(wallet, amount) : ''),
    [wallet, amount],
  );

  const estimatedUsd = useMemo(() => {
    if (!wallet) {
      return 0;
    }
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return 0;
    }
    const rate = usdRates[wallet.coingeckoId] ?? 0;
    return parsedAmount * rate;
  }, [amount, usdRates, wallet]);

  const copyAddress = async () => {
    if (!wallet?.address) {
      return;
    }
    await navigator.clipboard.writeText(wallet.address);
  };

  if (!wallet) {
    return null;
  }

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {wallet.label}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-body-sm font-weight-label text-muted">
              {t('object_edit_wallet_address')}:
            </p>
            <div className="mt-1 flex gap-2">
              <input
                readOnly
                className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg"
                value={wallet.address}
              />
              <button
                type="button"
                className="rounded-btn border border-border px-3 py-2 text-body-sm"
                onClick={() => void copyAddress()}
                aria-label={t('copy_button')}
              >
                {t('copy_button')}
              </button>
            </div>
          </div>

          <div>
            <p className="text-body-sm font-weight-label text-muted">{t('amount')}:</p>
            <input
              type="number"
              min="0"
              step="any"
              placeholder={t('enter_amount')}
              className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-body focus-visible:border-accent focus-visible:outline-none"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="mt-2 text-body-sm text-muted">
              {t('estimated_value').replace(
                '{estimate}',
                formatSidebarUsd(estimatedUsd, locale),
              )}
            </p>
          </div>

          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cryptoWalletQrCodeUrl(qrPayload)}
              alt=""
              width={220}
              height={220}
              className="rounded-btn border border-border bg-surface p-2"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="rounded-btn bg-accent px-4 py-2 text-body font-weight-strong text-accent-fg"
            onClick={onClose}
          >
            {t('ok')}
          </button>
        </div>
      </div>
    </AppModal>
  );
}

export function mapCryptoWalletIconSrc(wallet: UserAccountSidebarCryptoWallet): string {
  return cryptoWalletIconSrc(wallet.icon);
}

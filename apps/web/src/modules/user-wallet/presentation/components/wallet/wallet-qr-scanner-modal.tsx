'use client';

import { useCallback, useId, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import { Scanner } from '@yudiel/react-qr-scanner';

export type WalletQrScannerModalProps = {
  open: boolean;
  onClose: () => void;
  onAccept: (rawPayload: string) => void;
};

export function WalletQrScannerModal({
  open,
  onClose,
  onAccept,
}: WalletQrScannerModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [result, setResult] = useState('');

  const handleScan = useCallback((detectedCodes: { rawValue: string }[]) => {
    const next = detectedCodes[0]?.rawValue?.trim();
    if (!next) {
      return;
    }
    setResult((prev) => (prev === next ? prev : next));
  }, []);

  const handleClose = () => {
    setResult('');
    onClose();
  };

  const handleAccept = () => {
    if (!result) {
      return;
    }
    onAccept(result);
    setResult('');
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <AppModal open={open} onClose={handleClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('qr_code_scanner')}
          </h2>
          <AppModalCloseButton onClose={handleClose} />
        </div>

        <div className="overflow-hidden rounded-btn border border-border">
          <Scanner
            onScan={handleScan}
            constraints={{ facingMode: 'environment' }}
            scanDelay={300}
            styles={{ container: { width: '100%', minHeight: 240 } }}
          />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-body-sm font-weight-strong text-fg">
            {t('wallet_qr_scan_result')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="min-w-0 flex-1 break-all rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-muted">
              {result || '—'}
            </span>
            <button
              type="button"
              className="shrink-0 rounded-btn bg-accent px-4 py-2 text-body font-weight-strong text-accent-fg disabled:opacity-50"
              disabled={!result}
              onClick={handleAccept}
            >
              {t('wallet_qr_accept')}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="rounded-btn border border-border bg-surface px-4 py-2 text-body font-weight-strong text-fg"
            onClick={handleClose}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </AppModal>
  );
}

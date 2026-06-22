'use client';

import { useId, useMemo, useState } from 'react';

import { buildDelegateRcOp } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserRefSearchField } from '@/modules/object-updates/presentation/components/user-ref-search-field';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import {
  hiveWalletFormValidationMessageKey,
  parseHiveRcAmount,
  validateHiveRcAmount,
  validateHiveWalletRecipient,
} from '../../../domain/hive-wallet-form-validation';
import { getHiveDelegateRcMaxAmount } from '../../../domain/wallet-modal-balances';
import { formatHiveRcBillionsDisplay } from '../../../domain/wallet-modal-format';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { EngineTokenAmountField } from '../engine-token/engine-token-amount-field';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { useWalletBalances } from '../wallet/wallet-balances-context';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';

export type HiveDelegateRcModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
};

export function HiveDelegateRcModal({
  open,
  onClose,
  account,
}: HiveDelegateRcModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { hiveSummary } = useWalletBalances();
  const maxRc = useMemo(
    () => getHiveDelegateRcMaxAmount(hiveSummary),
    [hiveSummary],
  );
  const { broadcast, pending, error, setError } = useHiveBroadcast(account);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      validateHiveWalletRecipient(to) === null &&
      validateHiveRcAmount(amount, maxRc) === null
    );
  }, [amount, maxRc, to]);

  const onSubmit = async () => {
    setError(null);
    const recipientError = validateHiveWalletRecipient(to);
    if (recipientError) {
      setValidationError(t(hiveWalletFormValidationMessageKey(recipientError)));
      return;
    }
    const amountError = validateHiveRcAmount(amount, maxRc);
    if (amountError) {
      setValidationError(t(hiveWalletFormValidationMessageKey(amountError)));
      return;
    }
    setValidationError(null);
    const parsed = parseHiveRcAmount(amount);
    if (parsed === null) {
      return;
    }
    const op = buildDelegateRcOp({
      from: account,
      to: to.trim().toLowerCase(),
      rc: parsed,
    });
    const ok = await broadcast([op]);
    if (ok) {
      setTo('');
      setAmount('');
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('delegate_rc')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <p className="mb-4 text-body-sm text-muted">
          {t('delegate_rc_modal_info')}
        </p>
        <div className="space-y-4">
          <div>
            <WalletModalFieldLabel>{t('target_account')}</WalletModalFieldLabel>
            <div className="mt-1">
              <UserRefSearchField
                value={to}
                onChange={(name) => {
                  setTo(name);
                  setValidationError(null);
                }}
                excludeAccountNames={[account]}
                fieldLabel={t('target_account')}
              />
            </div>
          </div>
          <EngineTokenAmountField
            label={t('amount_to_delegate')}
            value={amount}
            onChange={(value) => {
              setAmount(value);
              setValidationError(null);
            }}
            maxAmount={maxRc}
            placeholder="0 RC"
          />
        </div>
        {maxRc !== '0' ? (
          <WalletModalBalanceLine
            amount={maxRc}
            displayAmount={formatHiveRcBillionsDisplay(maxRc)}
            symbol="b RC"
            onSelect={() => setAmount(maxRc)}
          />
        ) : null}
        <p className="mt-4 text-body-sm text-muted">{t('delegate_modal_info_part4')}</p>
        {validationError ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {validationError}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {t(engineTokenBroadcastErrorMessageKey(error))}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-6 w-full rounded-btn bg-accent px-4 py-2 text-body font-weight-label text-accent-fg disabled:opacity-50"
          disabled={pending || !canSubmit}
          onClick={() => void onSubmit()}
        >
          {pending ? '…' : t('delegate_rc')}
        </button>
      </div>
    </AppModal>
  );
}

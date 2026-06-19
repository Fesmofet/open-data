'use client';

import { useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserRefSearchField } from '@/modules/object-updates/presentation/components/user-ref-search-field';
import {
  AppModal,
  AppModalCloseButton,
} from '@/shared/presentation';

import { WAIV_DELEGATION_RETURN_DAYS } from '../../../domain/waiv-delegation-return-days';
import {
  engineTokenFormValidationMessageKey,
  validateEngineTokenAmount,
  validateEngineTokenRecipient,
} from '../../../domain/engine-token-form-validation';
import {
  formatEngineTokenQuantity,
  parseEngineTokenAmount,
} from '../../../domain/engine-token-amount';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { EngineTokenAmountField } from './engine-token-amount-field';
import type { EngineTokenDelegateModalState } from './engine-token-modal-context';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';

export type EngineTokenDelegateModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: EngineTokenDelegateModalState;
};

export function EngineTokenDelegateModal({
  open,
  onClose,
  account,
  state,
}: EngineTokenDelegateModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { broadcast, pending, error, setError } = useEngineTokenBroadcast(account);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      validateEngineTokenRecipient(to) === null &&
      validateEngineTokenAmount(amount, state.maxStake) === null
    );
  }, [amount, state.maxStake, to]);

  const onSubmit = async () => {
    setError(null);
    const recipientError = validateEngineTokenRecipient(to);
    if (recipientError) {
      setValidationError(t(engineTokenFormValidationMessageKey(recipientError)));
      return;
    }
    const amountError = validateEngineTokenAmount(amount, state.maxStake);
    if (amountError) {
      setValidationError(t(engineTokenFormValidationMessageKey(amountError)));
      return;
    }
    setValidationError(null);
    const parsed = parseEngineTokenAmount(amount);
    if (parsed === null) {
      return;
    }
    const ok = await broadcast('delegate', {
      symbol: state.symbol,
      quantity: formatEngineTokenQuantity(parsed),
      to: to.trim().toLowerCase(),
    });
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
            {t('delegate')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <p className="mb-4 text-body-sm text-muted">
          {t('delegate_modal_info_part1')}
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
            maxAmount={state.maxStake}
          />
        </div>
        <WalletModalBalanceLine
          amount={state.maxStake}
          symbol={state.symbol}
          onSelect={() => setAmount(state.maxStake)}
        />
        <div className="mt-4 space-y-2 text-body-sm text-muted">
          <p>
            {t('delegate_modal_info_part2')} {WAIV_DELEGATION_RETURN_DAYS}{' '}
            {t('delegate_modal_info_part3')}
          </p>
          <p>{t('delegate_modal_info_part4')}</p>
        </div>
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
          {pending ? '…' : t('delegate')}
        </button>
      </div>
    </AppModal>
  );
}

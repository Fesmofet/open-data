'use client';

import { useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserRefSearchField } from '@/modules/object-updates/presentation/components/user-ref-search-field';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import {
  AppModal,
  AppModalCloseButton,
} from '@/shared/presentation';

import {
  engineTokenFormValidationMessageKey,
  validateEngineTokenAmount,
  validateEngineTokenRecipient,
} from '../../../domain/engine-token-form-validation';
import {
  formatEngineTokenQuantity,
  formatEngineTokenUsdEstimate,
  parseEngineTokenAmount,
} from '../../../domain/engine-token-amount';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { EngineTokenAmountField } from './engine-token-amount-field';
import type { EngineTokenTransferModalState } from './engine-token-modal-context';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';

export type EngineTokenTransferModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: EngineTokenTransferModalState;
};

export function EngineTokenTransferModal({
  open,
  onClose,
  account,
  state,
}: EngineTokenTransferModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const memoId = useId();
  const { broadcast, pending, error, setError } = useEngineTokenBroadcast(account);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const estimatedUsdLabel = useMemo(
    () =>
      interpolateMessage(t('estimated_value'), {
        estimate: `${formatEngineTokenUsdEstimate(amount, state.tokenUsdRate)} USD`,
      }),
    [amount, state.tokenUsdRate, t],
  );

  const canSubmit = useMemo(() => {
    return (
      validateEngineTokenRecipient(to) === null &&
      validateEngineTokenAmount(amount, state.maxLiquid) === null
    );
  }, [amount, state.maxLiquid, to]);

  const onSubmit = async () => {
    setError(null);
    const recipientError = validateEngineTokenRecipient(to);
    if (recipientError) {
      setValidationError(t(engineTokenFormValidationMessageKey(recipientError)));
      return;
    }
    const amountError = validateEngineTokenAmount(amount, state.maxLiquid);
    if (amountError) {
      setValidationError(t(engineTokenFormValidationMessageKey(amountError)));
      return;
    }
    setValidationError(null);
    const parsed = parseEngineTokenAmount(amount);
    if (parsed === null) {
      return;
    }
    const ok = await broadcast('transfer', {
      symbol: state.symbol,
      quantity: formatEngineTokenQuantity(parsed),
      to: to.trim().toLowerCase(),
      memo: memo.trim(),
    });
    if (ok) {
      setTo('');
      setAmount('');
      setMemo('');
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('transfer_modal_title')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <div className="space-y-4">
          <div>
            <WalletModalFieldLabel>{t('to')}</WalletModalFieldLabel>
            <div className="mt-1">
              <UserRefSearchField
                value={to}
                onChange={(name) => {
                  setTo(name);
                  setValidationError(null);
                }}
                excludeAccountNames={[account]}
                fieldLabel={t('to')}
              />
            </div>
          </div>
          <EngineTokenAmountField
            label={t('amount')}
            value={amount}
            onChange={(value) => {
              setAmount(value);
              setValidationError(null);
            }}
            maxAmount={state.maxLiquid}
            placeholder={t('amount_placeholder')}
          />
          <div>
            <WalletModalFieldLabel>{t('memo_optional')}</WalletModalFieldLabel>
            <textarea
              id={memoId}
              rows={3}
              className="mt-1 w-full resize-y rounded-btn border border-border bg-bg px-3 py-2 text-body text-fg"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t('memo_placeholder')}
            />
          </div>
        </div>
        <WalletModalBalanceLine
          amount={state.maxLiquid}
          symbol={state.symbol}
          onSelect={() => setAmount(state.maxLiquid)}
        />
        <p className="mt-2 text-body-sm text-muted">{estimatedUsdLabel}</p>
        <p className="mt-4 text-body-sm text-muted">{t('transfer_modal_info')}</p>
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
          {pending ? '…' : t('transfer')}
        </button>
      </div>
    </AppModal>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  HAS_SIGN_ERROR_EVENT,
  HAS_SIGN_SUCCESS_EVENT,
  HAS_SIGN_WAIT_EVENT,
  type HasSignErrorEventDetail,
  type HasSignWaitEventDetail,
  type HasSignWaitKind,
} from '@/modules/auth/infrastructure/has-sign-wait-events';
import { ModalShell } from '@/shared/presentation/components/modal-shell';

type HasSignWaitModalState =
  | { phase: 'closed' }
  | { phase: 'waiting'; kind: HasSignWaitKind }
  | { phase: 'error'; kind: HasSignWaitKind; message: string };

function messageKeyForKind(kind: HasSignWaitKind): string {
  switch (kind) {
    case 'vote':
      return 'auth_keychain_has_sign_wait_vote';
    case 'comment':
      return 'auth_keychain_has_sign_wait_comment';
    case 'transaction':
      return 'auth_keychain_has_sign_wait_transaction';
    default:
      return 'auth_keychain_has_sign_wait_generic';
  }
}

export function HasSignWaitProvider() {
  const { t } = useI18n();
  const [state, setState] = useState<HasSignWaitModalState>({ phase: 'closed' });
  const openRef = useRef(false);

  const closeModal = useCallback(() => {
    openRef.current = false;
    setState({ phase: 'closed' });
  }, []);

  useEffect(() => {
    function onSignWait(event: Event) {
      if (openRef.current) {
        return;
      }
      const detail = (event as CustomEvent<HasSignWaitEventDetail>).detail;
      const kind = detail?.kind ?? 'generic';
      openRef.current = true;
      setState({ phase: 'waiting', kind });
    }

    function onSignSuccess() {
      closeModal();
    }

    function onSignError(event: Event) {
      const detail = (event as CustomEvent<HasSignErrorEventDetail>).detail;
      const message = detail?.message?.trim() || t('auth_keychain_has_sign_wait_error_fallback');
      setState((current) => ({
        phase: 'error',
        kind: current.phase === 'closed' ? 'generic' : current.kind,
        message,
      }));
    }

    window.addEventListener(HAS_SIGN_WAIT_EVENT, onSignWait);
    window.addEventListener(HAS_SIGN_SUCCESS_EVENT, onSignSuccess);
    window.addEventListener(HAS_SIGN_ERROR_EVENT, onSignError);
    return () => {
      window.removeEventListener(HAS_SIGN_WAIT_EVENT, onSignWait);
      window.removeEventListener(HAS_SIGN_SUCCESS_EVENT, onSignSuccess);
      window.removeEventListener(HAS_SIGN_ERROR_EVENT, onSignError);
    };
  }, [closeModal, t]);

  const open = state.phase !== 'closed';
  const kind = state.phase === 'closed' ? 'generic' : state.kind;
  const isWaiting = state.phase === 'waiting';
  const errorMessage = state.phase === 'error' ? state.message : null;

  return (
    <ModalShell
      open={open}
      onClose={isWaiting ? () => undefined : closeModal}
      closeOnBackdrop={!isWaiting}
      labelledBy="has-sign-wait-title"
      describedBy="has-sign-wait-body"
      maxWidthClass="max-w-md"
      panelClassName="rounded-card-lg"
      header={
        <div className="border-b border-border px-card-padding py-3">
          <h2
            id="has-sign-wait-title"
            className="text-section font-display text-heading"
          >
            {t('auth_keychain_has_sign_wait_title')}
          </h2>
        </div>
      }
      footer={
        errorMessage ? (
          <div className="border-t border-border px-card-padding py-3">
            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-btn bg-secondary px-4 py-2 font-label text-secondary-fg hover:opacity-90"
            >
              {t('close')}
            </button>
          </div>
        ) : undefined
      }
    >
      <div id="has-sign-wait-body" className="flex flex-col gap-4 p-card-padding">
        <p className="text-body text-fg-secondary">{t(messageKeyForKind(kind))}</p>
        <p className="text-body-sm text-fg-secondary">{t('auth_keychain_has_mobile_hint')}</p>

        {isWaiting ? (
          <div className="flex items-center gap-3" role="status">
            <span
              className="inline-block h-5 w-5 animate-spin rounded-circle border-2 border-accent border-t-transparent"
              aria-hidden
            />
            <span className="text-body-sm text-fg-secondary">
              {t('auth_keychain_has_sign_wait_status')}
            </span>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="text-body-sm text-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </ModalShell>
  );
}

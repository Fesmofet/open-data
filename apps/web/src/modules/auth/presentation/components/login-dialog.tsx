'use client';

import { useRouter } from 'next/navigation';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import { WALLET_PROVIDERS } from '../../domain/wallet-providers';
import { ProviderList } from './provider-list';

export type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
};

const INLINE_PROVIDERS = WALLET_PROVIDERS.filter((p) => p.id !== 'hiveauth');

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const router = useRouter();
  const { t } = useI18n();

  function handleLoginSuccess() {
    onClose();
    router.refresh();
  }

  const header = (
    <div className="flex items-center justify-between gap-4 border-b border-border px-card-padding py-3">
      <h2
        id="login-dialog-title"
        className="min-w-0 flex-1 text-section font-display text-heading"
      >
        Sign in
      </h2>
      <ModalShellCloseButton onClose={onClose} ariaLabel={t('close')} />
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      labelledBy="login-dialog-title"
      maxWidthClass="max-w-container-narrow"
      panelClassName="rounded-card-lg"
      header={header}
    >
      <div className="p-card-padding">
        <ProviderList providers={INLINE_PROVIDERS} onLoginSuccess={handleLoginSuccess} />
      </div>
    </ModalShell>
  );
}

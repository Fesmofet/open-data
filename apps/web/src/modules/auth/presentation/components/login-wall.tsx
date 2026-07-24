'use client';

import { WALLET_PROVIDERS } from '../../domain/wallet-providers';
import { navigateAfterSignInWallLogin } from '../navigate-after-sign-in-wall-login';
import { ProviderList } from './provider-list';

const INLINE_PROVIDERS = WALLET_PROVIDERS.filter((p) => p.id !== 'hiveauth');

export function LoginWall() {
  function handleLoginSuccess() {
    navigateAfterSignInWallLogin();
  }

  return (
    <ProviderList
      providers={INLINE_PROVIDERS}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { LoginWall } from './login-wall';

export function SignInCard() {
  const { t } = useI18n();

  return (
    <>
      <h1 className="text-section font-display text-heading">{t('auth_sign_in_title')}</h1>
      <p className="mt-2 text-body text-fg-secondary">{t('auth_sign_in_subtitle')}</p>
      <LoginWall />
    </>
  );
}

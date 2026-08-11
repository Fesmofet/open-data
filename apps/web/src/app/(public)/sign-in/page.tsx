import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { SignInCard } from '@/modules/auth/presentation/components/sign-in-card';
import { buildSignInMetadata } from '@/seo';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return buildSignInMetadata({ locale, messages });
}

export default async function SignInPage() {
  const user = await createCookieAuthContextProvider().getUser();
  if (user) {
    redirect('/');
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-container-narrow rounded-card-lg border border-border bg-surface p-card-padding shadow-card-float">
        <SignInCard />
      </div>
    </div>
  );
}

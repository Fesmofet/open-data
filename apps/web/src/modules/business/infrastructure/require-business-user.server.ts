import { redirect } from 'next/navigation';

import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function requireBusinessUser(): Promise<{ username: string }> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  return { username: user.username };
}

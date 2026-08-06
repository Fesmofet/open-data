import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { HomeFeedPostsList } from '@/modules/home';
import { getHomeFeedPageQuery } from '@/modules/home/application/queries/get-home-feed-page.query';
import { getRequestUser } from '@/shared/infrastructure/auth/get-request-user.server';
import { buildHomeMetadata } from '@/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return buildHomeMetadata({ locale, messages });
}

export default async function Index() {
  const user = await getRequestUser();
  const viewer = user?.username ?? null;
  const initialPage = await getHomeFeedPageQuery({ limit: 20 }, viewer);

  return (
    <main className="px-gutter py-section-y sm:px-gutter-sm">
      <HomeFeedPostsList initialPage={initialPage} currentUsername={viewer} />
    </main>
  );
}

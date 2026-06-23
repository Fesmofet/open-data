import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { OptimisticNavProvider, OptimisticNavSync } from '@/shared/presentation';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { getRequestUser } from '@/shared/infrastructure/auth/get-request-user.server';
import { JsonLdScript } from '@/seo';
import { ObjectPageRightRailSkeleton } from '@/modules/object/presentation/components/object-page-loading-skeleton';

import { loadObjectPageModel } from './object-page-model.server';
import { ObjectPageShellClient } from './object-page-shell-client';
import { ObjectPageRightRailSection } from './object-page-right-rail-section.server';

export default async function ObjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ 'object-id': string }>;
}) {
  const { 'object-id': rawId } = await params;
  const objectId = decodeURIComponent(rawId);
  const locale = await getRequestLocale();
  const user = await getRequestUser();
  const viewerUsername = user?.username ?? null;

  const model = await loadObjectPageModel(objectId, locale, viewerUsername);
  if (!model) {
    notFound();
  }

  const followersTabCount =
    model.primaryTabs.find((tab) => tab.segment === 'followers')?.count ?? 0;

  const rightRailSlot = (
    <Suspense fallback={<ObjectPageRightRailSkeleton />}>
      <ObjectPageRightRailSection
        objectId={objectId}
        objectTypeKey={model.objectTypeKey}
        locale={locale}
        viewerUsername={viewerUsername}
        followersTabCount={followersTabCount}
      />
    </Suspense>
  );

  return (
    <OptimisticNavProvider>
      <JsonLdScript data={model.seo?.json_ld} />
      <Suspense fallback={null}>
        <OptimisticNavSync />
      </Suspense>
      <ObjectPageShellClient
        model={model}
        viewerUsername={viewerUsername}
        rightRailSlot={rightRailSlot}
      >
        {children}
      </ObjectPageShellClient>
    </OptimisticNavProvider>
  );
}

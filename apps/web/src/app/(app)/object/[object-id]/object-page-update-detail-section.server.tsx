import { notFound } from 'next/navigation';

import { fetchObjectUpdateById } from '@/modules/object-updates/infrastructure/clients/object-updates.client';

import { ObjectPageUpdateDetailClient } from './object-page-update-detail-client';

export type ObjectPageUpdateDetailSectionProps = {
  objectId: string;
  updateId: string;
  locale: string;
  viewerUsername: string | null;
};

export async function ObjectPageUpdateDetailSection({
  objectId,
  updateId,
  locale,
  viewerUsername,
}: ObjectPageUpdateDetailSectionProps) {
  const item = await fetchObjectUpdateById({
    objectId,
    updateId,
    locale,
    viewer: viewerUsername,
  });
  if (!item || item.object_id !== objectId) {
    notFound();
  }

  return (
    <ObjectPageUpdateDetailClient
      objectId={objectId}
      item={item}
      viewerUsername={viewerUsername}
    />
  );
}

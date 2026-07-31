'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { buildObjectUpdatesPath } from '@/modules/object/domain/object-page-url.constants';
import type { ObjectUpdateFeedItemView } from '@/modules/object-updates/application/dto/object-updates-feed.dto';
import { UpdateCard } from '@/modules/object-updates/presentation/components/update-card';

export type ObjectPageUpdateDetailClientProps = {
  objectId: string;
  item: ObjectUpdateFeedItemView;
  viewerUsername: string | null;
};

export function ObjectPageUpdateDetailClient({
  objectId,
  item,
  viewerUsername,
}: ObjectPageUpdateDetailClientProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={buildObjectUpdatesPath(objectId)}
        className="text-sm text-link hover:underline w-fit"
      >
        {t('object_update_back_to_updates')}
      </Link>
      <UpdateCard
        item={item}
        showLocaleBadge={item.locale != null && item.locale.length > 0}
        viewerUsername={viewerUsername}
      />
    </div>
  );
}

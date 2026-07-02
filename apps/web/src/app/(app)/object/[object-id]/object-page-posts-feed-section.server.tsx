import { getObjectPostsFeedPageQuery } from '@/modules/feed';

import { ObjectPostsFeedList } from './object-posts-feed-list';

export type ObjectPagePostsFeedSectionProps = {
  objectId: string;
  viewerUsername: string | null;
};

export async function ObjectPagePostsFeedSection({
  objectId,
  viewerUsername,
}: ObjectPagePostsFeedSectionProps) {
  const initialPage = await getObjectPostsFeedPageQuery(objectId, {}, viewerUsername);

  return (
    <ObjectPostsFeedList
      objectId={objectId}
      initialPage={initialPage}
      currentUsername={viewerUsername}
    />
  );
}

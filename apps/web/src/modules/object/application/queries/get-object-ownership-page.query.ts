import {
  paginatedUserFollowListSchema,
  type PaginatedUserFollowListView,
  type UserSubscriptionSort,
} from '@/modules/user-social/application/dto/user-social.dto';

import { fetchObjectOwnership } from '../../infrastructure/clients/object-ownership.client';

export async function getObjectOwnershipPageQuery(
  objectId: string,
  args: {
    ownershipType: 'supervised' | 'exclusive';
    sort: UserSubscriptionSort;
    skip: number;
    limit: number;
  },
  viewer?: string | null,
): Promise<PaginatedUserFollowListView> {
  const raw = await fetchObjectOwnership(objectId, args, { viewer });
  if (raw === null) {
    return { items: [], total: 0, hasMore: false };
  }
  const parsed = paginatedUserFollowListSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      '[getObjectOwnershipPageQuery] unexpected response shape:',
      parsed.error.flatten(),
    );
    return { items: [], total: 0, hasMore: false };
  }
  return parsed.data;
}

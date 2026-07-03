import {
  paginatedObjectExpertListSchema,
  type PaginatedObjectExpertListView,
} from '../../domain/types/object-experts';

import { fetchObjectExperts } from '../../infrastructure/clients/object-social.client';

export async function getObjectExpertsPageQuery(
  objectId: string,
  args: { skip: number; limit: number },
  viewer?: string | null,
): Promise<PaginatedObjectExpertListView> {
  const raw = await fetchObjectExperts(objectId, args, { viewer });
  if (raw === null) {
    return { items: [], total: 0, hasMore: false };
  }
  const parsed = paginatedObjectExpertListSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      '[getObjectExpertsPageQuery] unexpected response shape:',
      parsed.error.flatten(),
    );
    return { items: [], total: 0, hasMore: false };
  }
  return parsed.data;
}

import type { ObjectPageViewModel } from '@/modules/object';
import { getObjectUpdatesFeedPageQuery } from '@/modules/object-updates';
import type { ObjectEmbeddedUpdatesFeedModel } from '@/modules/object-updates/embedded-updates-feed.model';

import { buildEmbeddedUpdatesFeedMeta } from './build-embedded-updates-feed-meta';

export { buildEmbeddedUpdatesFeedMeta } from './build-embedded-updates-feed-meta';

export async function fetchEmbeddedUpdatesFeed(
  objectId: string,
  model: ObjectPageViewModel,
  sp: Record<string, string | string[] | undefined>,
  init: { locale: string; viewer: string | null },
): Promise<ObjectEmbeddedUpdatesFeedModel> {
  const meta = buildEmbeddedUpdatesFeedMeta(model, sp);
  const initialPage = await getObjectUpdatesFeedPageQuery(
    objectId,
    { filters: meta.filters, cursor: null },
    init,
  );

  return {
    ...meta,
    initialPage,
  };
}

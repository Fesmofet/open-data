import type { OffersListTab } from '../domain/routes';
import { OBL_LIST_PAGE_SIZE } from '../domain/obl-pagination.types';
import { fetchOblDraftList } from './clients/obl-drafts.server';
import { searchOblOffers } from './clients/obl-offers.server';
import { requireBusinessUser } from './require-business-user.server';

export async function loadBusinessOffersList(tab: OffersListTab) {
  const { username } = await requireBusinessUser();
  if (tab === 'drafts') {
    const drafts = await fetchOblDraftList(username, {
      limit: OBL_LIST_PAGE_SIZE,
      offset: 0,
    });
    return {
      username,
      drafts: drafts ?? { items: [], hasMore: false },
      published: { items: [], hasMore: false },
    };
  }
  const status = tab === 'retired' ? 'retired' : 'active';
  const published = await searchOblOffers({
    author: username,
    status,
    limit: OBL_LIST_PAGE_SIZE,
    offset: 0,
  });
  return {
    username,
    drafts: { items: [], hasMore: false },
    published: published ?? { items: [], hasMore: false },
  };
}

import { fetchOblDraftList } from './clients/obl-drafts.server';
import { searchOblOffers } from './clients/obl-offers.server';
import { requireBusinessUser } from './require-business-user.server';

export async function loadBusinessOffersList() {
  const { username } = await requireBusinessUser();
  const [drafts, published] = await Promise.all([
    fetchOblDraftList(username),
    searchOblOffers({ author: username, limit: 100, status: 'all' }),
  ]);
  return { username, drafts, published: published ?? [] };
}

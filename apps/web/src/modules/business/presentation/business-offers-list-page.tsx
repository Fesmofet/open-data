import { BusinessOffersListClient } from './components/business-offers-list-client';
import type { OblOfferKindRoute, OffersListTab } from '../domain/routes';
import { loadBusinessOffersList } from '../infrastructure/load-business-offers-list.server';

export type BusinessOffersListPageProps = {
  kind: OblOfferKindRoute;
  tab: OffersListTab;
};

export async function BusinessOffersListPage({ kind, tab }: BusinessOffersListPageProps) {
  const { username, drafts, published } = await loadBusinessOffersList(tab);
  return (
    <BusinessOffersListClient
      username={username}
      kind={kind}
      tab={tab}
      initialDrafts={drafts}
      initialPublished={published}
    />
  );
}

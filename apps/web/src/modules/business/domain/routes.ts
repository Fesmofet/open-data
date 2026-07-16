export type OblOfferKindRoute = 'offer' | 'request';

export type OffersListTab = 'drafts' | 'published' | 'retired';

export type BusinessNavId =
  | 'discover'
  | 'offers'
  | 'requests'
  | 'relationships';

export function businessNavIdForKind(kind: OblOfferKindRoute): BusinessNavId {
  return kind === 'request' ? 'requests' : 'offers';
}

const MANAGE_OFFERS = '/business/manage/offers';
const MANAGE_REQUESTS = '/business/manage/requests';

export const businessRoutes = {
  discover: '/business/offers',
  discoverOffers: '/business/offers',
  discoverRequests: '/business/requests',
  manageOffers: `${MANAGE_OFFERS}/drafts`,
  manageRequests: `${MANAGE_REQUESTS}/drafts`,
  manageWithKind: (kind: OblOfferKindRoute) =>
    kind === 'request' ? MANAGE_REQUESTS : MANAGE_OFFERS,
  manageTab: (kind: OblOfferKindRoute, tab: OffersListTab) =>
    `${businessRoutes.manageWithKind(kind)}/${tab}`,
  manageNew: (kind: OblOfferKindRoute = 'offer') =>
    kind === 'request' ? `${MANAGE_REQUESTS}/new` : `${MANAGE_OFFERS}/new`,
  offerDraft: (kind: OblOfferKindRoute, draftId: string) =>
    `${businessRoutes.manageWithKind(kind)}/drafts/${encodeURIComponent(draftId)}`,
  offerDraftPreview: (kind: OblOfferKindRoute, draftId: string) =>
    `${businessRoutes.manageWithKind(kind)}/drafts/${encodeURIComponent(draftId)}/preview`,
  offerDetail: (offerId: string) =>
    `${MANAGE_OFFERS}/${encodeURIComponent(offerId)}`,
  offerVersion: (offerId: string, version: number) =>
    `${MANAGE_OFFERS}/${encodeURIComponent(offerId)}/versions/${version}`,
  relationships: '/business/relationships',
  relationship: (account: string) =>
    `/business/relationships/${encodeURIComponent(account)}`,
  contract: (contractId: string) =>
    `/business/contracts/${encodeURIComponent(contractId)}`,
  publicOffer: (offerId: string, version: number) =>
    `/offers/${encodeURIComponent(offerId)}/versions/${version}`,
  publicRequest: (offerId: string, version: number) =>
    `/requests/${encodeURIComponent(offerId)}/versions/${version}`,
  publicOffers: '/business/offers',
  publicRequests: '/business/requests',
} as const;

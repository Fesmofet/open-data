export const businessRoutes = {
  overview: '/business',
  offers: '/business/offers',
  offersNew: '/business/offers/new',
  offerDraft: (draftId: string) => `/business/offers/drafts/${encodeURIComponent(draftId)}`,
  offerDraftPreview: (draftId: string) =>
    `/business/offers/drafts/${encodeURIComponent(draftId)}/preview`,
  offerDetail: (offerId: string) => `/business/offers/${encodeURIComponent(offerId)}`,
  offerVersion: (offerId: string, version: number) =>
    `/business/offers/${encodeURIComponent(offerId)}/versions/${version}`,
  relationships: '/business/relationships',
  relationship: (account: string) =>
    `/business/relationships/${encodeURIComponent(account)}`,
  contract: (contractId: string) =>
    `/business/contracts/${encodeURIComponent(contractId)}`,
  publicOffer: (offerId: string, version: number) =>
    `/offers/${encodeURIComponent(offerId)}/versions/${version}`,
  publicRequest: (offerId: string, version: number) =>
    `/requests/${encodeURIComponent(offerId)}/versions/${version}`,
  publicOffers: '/offers',
  publicRequests: '/requests',
} as const;

export type BusinessNavId =
  | 'overview'
  | 'offers'
  | 'relationships';

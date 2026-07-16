import { businessRoutes } from './routes';

describe('businessRoutes', () => {
  it('builds discover paths', () => {
    expect(businessRoutes.discover).toBe('/business/offers');
    expect(businessRoutes.discoverOffers).toBe('/business/offers');
    expect(businessRoutes.discoverRequests).toBe('/business/requests');
    expect(businessRoutes.publicOffers).toBe('/business/offers');
    expect(businessRoutes.publicRequests).toBe('/business/requests');
  });

  it('builds private manage paths', () => {
    expect(businessRoutes.manageOffers).toBe('/business/manage/offers/drafts');
    expect(businessRoutes.manageRequests).toBe('/business/manage/requests/drafts');
    expect(businessRoutes.manageTab('offer', 'published')).toBe(
      '/business/manage/offers/published',
    );
    expect(businessRoutes.manageTab('request', 'retired')).toBe(
      '/business/manage/requests/retired',
    );
    expect(businessRoutes.offerDraft('offer', 'd-1')).toBe(
      '/business/manage/offers/drafts/d-1',
    );
    expect(businessRoutes.offerDraft('request', 'd-1')).toBe(
      '/business/manage/requests/drafts/d-1',
    );
    expect(businessRoutes.offerDraftPreview('offer', 'd-1')).toBe(
      '/business/manage/offers/drafts/d-1/preview',
    );
    expect(businessRoutes.offerDraftPreview('request', 'd-1')).toBe(
      '/business/manage/requests/drafts/d-1/preview',
    );
    expect(businessRoutes.offerDetail('offer-a')).toBe(
      '/business/manage/offers/offer-a',
    );
    expect(businessRoutes.offerVersion('offer-a', 3)).toBe(
      '/business/manage/offers/offer-a/versions/3',
    );
  });

  it('builds relationship and contract paths', () => {
    expect(businessRoutes.relationship('alice')).toBe('/business/relationships/alice');
    expect(businessRoutes.relationshipTab('alice', 'invoices')).toBe(
      '/business/relationships/alice?tab=invoices',
    );
    expect(businessRoutes.contract('c-9')).toBe('/business/contracts/c-9');
  });

  it('builds public sign paths', () => {
    expect(businessRoutes.publicOffer('o', 2)).toBe('/offers/o/versions/2');
    expect(businessRoutes.publicRequest('r', 1)).toBe('/requests/r/versions/1');
  });
});

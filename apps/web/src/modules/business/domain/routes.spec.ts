import { businessRoutes } from './routes';

describe('businessRoutes', () => {
  it('builds private offer paths', () => {
    expect(businessRoutes.offerDraft('d-1')).toBe('/business/offers/drafts/d-1');
    expect(businessRoutes.offerDraftPreview('d-1')).toBe(
      '/business/offers/drafts/d-1/preview',
    );
    expect(businessRoutes.offerDetail('offer-a')).toBe('/business/offers/offer-a');
    expect(businessRoutes.offerVersion('offer-a', 3)).toBe(
      '/business/offers/offer-a/versions/3',
    );
  });

  it('builds relationship and contract paths', () => {
    expect(businessRoutes.relationship('alice')).toBe('/business/relationships/alice');
    expect(businessRoutes.contract('c-9')).toBe('/business/contracts/c-9');
  });

  it('builds public discovery paths', () => {
    expect(businessRoutes.publicOffer('o', 2)).toBe('/offers/o/versions/2');
    expect(businessRoutes.publicRequest('r', 1)).toBe('/requests/r/versions/1');
  });
});

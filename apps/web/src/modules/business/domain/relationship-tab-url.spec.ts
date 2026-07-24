import {
  isRelationshipTab,
  parseRelationshipTab,
  RELATIONSHIP_TABS,
} from './relationship-tab-url';

describe('relationship-tab-url', () => {
  it('includes service-orders and reports tabs', () => {
    expect(RELATIONSHIP_TABS).toContain('service-orders');
    expect(RELATIONSHIP_TABS).toContain('reports');
  });

  it('parses service-orders tab from search params', () => {
    expect(parseRelationshipTab(new URLSearchParams('tab=service-orders'))).toBe('service-orders');
    expect(isRelationshipTab('reports')).toBe(true);
  });
});

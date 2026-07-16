import {
  buildRelationshipTabHref,
  parseRelationshipTab,
} from './relationship-tab-url';

describe('parseRelationshipTab', () => {
  it('defaults to payments', () => {
    expect(parseRelationshipTab({})).toBe('payments');
    expect(parseRelationshipTab(new URLSearchParams())).toBe('payments');
  });

  it('parses valid tab from search params', () => {
    expect(parseRelationshipTab({ tab: 'invoices' })).toBe('invoices');
    expect(parseRelationshipTab(new URLSearchParams('tab=disputes'))).toBe('disputes');
  });

  it('falls back to payments for invalid tab', () => {
    expect(parseRelationshipTab({ tab: 'overview' })).toBe('payments');
    expect(parseRelationshipTab({ tab: '' })).toBe('payments');
  });
});

describe('buildRelationshipTabHref', () => {
  it('omits query for default tab', () => {
    expect(buildRelationshipTabHref('flowmaster')).toBe('/business/relationships/flowmaster');
    expect(buildRelationshipTabHref('flowmaster', 'payments')).toBe(
      '/business/relationships/flowmaster',
    );
  });

  it('includes tab query for non-default tabs', () => {
    expect(buildRelationshipTabHref('flowmaster', 'contracts')).toBe(
      '/business/relationships/flowmaster?tab=contracts',
    );
  });
});

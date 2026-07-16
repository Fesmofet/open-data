export type OblOfferKind = 'offer' | 'request';

export type OblDisputeRule = 'client' | 'provider' | 'arbiter';

export type OfferTerms = {
  pricingModel?: 'fixed' | 'hourly' | 'custom';
  amountUsd?: string;
  currency?: string;
  billingCycle?: string;
};

export type OfferDraftFields = {
  offerId?: string;
  name?: string;
  description?: string;
  tags?: string[];
  serviceRef?: string;
  legalRef?: string;
  terms?: OfferTerms;
  disputeRule?: OblDisputeRule;
  arbiter?: string | null;
  billingNotes?: string;
  terminationNotes?: string;
  /** Set when cloning from a published offer for a new version flow. */
  publishedOfferId?: string;
};

export const OFFER_EDITOR_STEPS = [
  'basics',
  'service',
  'commercial',
  'billing',
  'termination',
  'disputes',
  'legal',
  'review',
] as const;

export type OfferEditorStep = (typeof OFFER_EDITOR_STEPS)[number];

export type OfferDraftState = {
  kind: OblOfferKind;
  fields: OfferDraftFields;
  legalText: string;
};

export function emptyOfferFields(): OfferDraftFields {
  return {
    name: '',
    description: '',
    tags: [],
    terms: { pricingModel: 'custom', amountUsd: '', currency: 'USD' },
    disputeRule: 'client',
    arbiter: null,
    billingNotes: '',
    terminationNotes: '',
  };
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 32);
}

export function formatTagsInput(tags: string[] | undefined): string {
  return (tags ?? []).join(', ');
}

export function getOfferTerms(fields: OfferDraftFields): OfferTerms {
  return fields.terms ?? {};
}

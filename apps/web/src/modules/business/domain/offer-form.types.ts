export type OblOfferKind = 'offer' | 'request';

export type OblDisputeRule = 'client' | 'provider' | 'arbiter';

export type OfferSignParam = {
  key: string;
  label: string;
  required?: boolean;
};

export type OfferTerminationTerms = {
  mode?: 'instant' | 'notice';
  who?: 'client' | 'provider' | 'both';
  noticeDays?: number;
  notes?: string;
};

export type OfferTerms = {
  pricingModel?: 'fixed' | 'hourly' | 'custom';
  amountUsd?: string;
  currency?: string;
  billingCycle?: string;
  termination?: OfferTerminationTerms;
  signParams?: OfferSignParam[];
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
  /** @deprecated migrated to terms.termination.notes on load */
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
    terms: {
      pricingModel: 'custom',
      amountUsd: '',
      currency: 'USD',
      termination: { mode: 'notice', who: 'both', noticeDays: 30 },
    },
    disputeRule: 'client',
    arbiter: null,
    billingNotes: '',
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

export function getOfferTermination(fields: OfferDraftFields): OfferTerminationTerms {
  return getOfferTerms(fields).termination ?? {};
}

/** Migrate legacy draft fields (e.g. terminationNotes) into structured terms. */
export function normalizeLoadedOfferFields(fields: OfferDraftFields): OfferDraftFields {
  const next: OfferDraftFields = { ...fields };
  const terms: OfferTerms = { ...getOfferTerms(next) };
  const termination: OfferTerminationTerms = { ...(terms.termination ?? {}) };

  const legacyNotes = next.terminationNotes?.trim() ?? '';
  if (legacyNotes.length > 0 && !(termination.notes?.trim())) {
    termination.notes = legacyNotes;
  }
  if (!termination.mode) {
    termination.mode = 'notice';
  }
  if (!termination.who) {
    termination.who = 'both';
  }
  if (termination.mode === 'notice' && termination.noticeDays === undefined) {
    termination.noticeDays = 30;
  }

  terms.termination = termination;
  delete next.terminationNotes;
  next.terms = terms;
  return next;
}

export function patchOfferTerms(
  fields: OfferDraftFields,
  patch: Partial<OfferTerms>,
): OfferDraftFields {
  return { ...fields, terms: { ...getOfferTerms(fields), ...patch } };
}

export function patchOfferTermination(
  fields: OfferDraftFields,
  patch: Partial<OfferTerminationTerms>,
): OfferDraftFields {
  const terms = getOfferTerms(fields);
  return {
    ...fields,
    terms: {
      ...terms,
      termination: { ...(terms.termination ?? {}), ...patch },
    },
  };
}

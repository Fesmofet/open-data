import {
  computeStepCompleteness,
  isPublishedOfferUpdate,
  normalizeOfferDraftForPublish,
  validateOfferDraftForPublish,
} from './offer-draft.schema';
import {
  emptyOfferFields,
  type OfferDraftFields,
  type OfferDraftState,
  type OfferEditorStep,
} from './offer-form.types';

describe('offer-draft.schema', () => {
  const baseState = (): OfferDraftState => ({
    kind: 'offer',
    fields: { ...emptyOfferFields(), name: 'Test offer' },
    legalText: '',
  });

  it('requires name for publish', () => {
    const state = baseState();
    state.fields.name = '';
    const result = validateOfferDraftForPublish(state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.basics).toContain('name_required');
    }
  });

  it('requires arbiter when dispute_rule is arbiter', () => {
    const state = baseState();
    state.fields.disputeRule = 'arbiter';
    state.fields.arbiter = '';
    const result = validateOfferDraftForPublish(state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.disputes).toContain('arbiter_required');
    }
  });

  it('passes publish validation with required fields', () => {
    const state = baseState();
    expect(validateOfferDraftForPublish(state).ok).toBe(true);
  });

  it('passes publish validation when optional refs are empty strings', () => {
    const state = baseState();
    state.fields.serviceRef = '';
    state.fields.legalRef = '';
    state.fields.arbiter = '';
    state.legalText = 'Draft notes only';
    expect(validateOfferDraftForPublish(state).ok).toBe(true);
  });

  it('normalizes empty optional refs before validation', () => {
    const state = baseState();
    state.fields.legalRef = '';
    const normalized = normalizeOfferDraftForPublish(state);
    expect(normalized.fields.legalRef).toBeUndefined();
  });

  it('marks basics incomplete without name', () => {
    const state = baseState();
    state.fields.name = '';
    state.fields.description = 'Some text';
    expect(computeStepCompleteness('basics', state)).toBe('incomplete');
  });

  it('detects published offer update by publishedOfferId', () => {
    const fields: OfferDraftFields = { publishedOfferId: 'existing-offer' };
    expect(isPublishedOfferUpdate(fields)).toBe(true);
  });

  it('marks termination incomplete when notice mode lacks noticeDays', () => {
    const state = baseState();
    state.fields.terms = {
      ...state.fields.terms,
      termination: { mode: 'notice', who: 'both' },
    };
    expect(computeStepCompleteness('termination', state)).toBe('incomplete');
  });

  it('requires noticeDays for publish when termination mode is notice', () => {
    const state = baseState();
    state.fields.terms = {
      ...state.fields.terms,
      termination: { mode: 'notice', who: 'both' },
    };
    const result = validateOfferDraftForPublish(state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.termination).toContain('termination_notice_days_required');
    }
  });

  it('normalizes termination and signParams into terms for publish', () => {
    const state = baseState();
    state.fields.terms = {
      pricingModel: 'custom',
      signParams: [{ key: 'targets', label: 'Targets', required: true }],
      termination: { mode: 'instant', who: 'provider', notes: 'Any time' },
    };
    const normalized = normalizeOfferDraftForPublish(state);
    expect(normalized.fields.terms?.signParams).toEqual([
      { key: 'targets', label: 'Targets', required: true },
    ]);
    expect(normalized.fields.terms?.termination).toEqual({
      mode: 'instant',
      who: 'provider',
      notes: 'Any time',
    });
  });
});

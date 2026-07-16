import { z } from 'zod';

import {
  OFFER_EDITOR_STEPS,
  type OfferDraftFields,
  type OfferDraftState,
  type OfferEditorStep,
  type OfferSignParam,
  getOfferTerms,
  getOfferTermination,
} from './offer-form.types';

export type StepCompleteness = 'empty' | 'incomplete' | 'complete';

const offerSignParamSchema = z.object({
  key: z.string().min(1).max(64),
  label: z.string().min(1).max(256),
  required: z.boolean().optional(),
});

const offerTerminationSchema = z.object({
  mode: z.enum(['instant', 'notice']).optional(),
  who: z.enum(['client', 'provider', 'both']).optional(),
  noticeDays: z.number().int().positive().optional(),
  notes: z.string().max(4096).optional(),
});

const offerTermsSchema = z.object({
  pricingModel: z.enum(['fixed', 'hourly', 'custom']).optional(),
  amountUsd: z.string().optional(),
  currency: z.string().max(16).optional(),
  billingCycle: z.string().max(256).optional(),
  termination: offerTerminationSchema.optional(),
  signParams: z.array(offerSignParamSchema).max(32).optional(),
});

const offerFieldsSchema = z.object({
  offerId: z.string().max(256).optional(),
  publishedOfferId: z.string().max(256).optional(),
  name: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  tags: z.array(z.string().min(1).max(64)).max(32).optional(),
  serviceRef: z.string().min(1).max(256).optional(),
  legalRef: z.string().min(1).max(256).optional(),
  terms: offerTermsSchema.optional(),
  disputeRule: z.enum(['client', 'provider', 'arbiter']).optional(),
  arbiter: z.string().min(1).max(32).nullable().optional(),
  billingNotes: z.string().max(4096).optional(),
});

export const offerDraftStateSchema = z
  .object({
    kind: z.enum(['offer', 'request']),
    fields: offerFieldsSchema,
    legalText: z.string().max(65536),
  })
  .superRefine((data, ctx) => {
    if (data.fields.disputeRule === 'arbiter') {
      const arbiter = data.fields.arbiter?.trim() ?? '';
      if (arbiter.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'arbiter_required',
          path: ['fields', 'arbiter'],
        });
      }
    }
    const termination = data.fields.terms?.termination;
    if (termination?.mode === 'notice') {
      const days = termination.noticeDays;
      if (days === undefined || days <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'termination_notice_days_required',
          path: ['fields', 'terms', 'termination', 'noticeDays'],
        });
      }
    }
  });

const publishFieldsSchema = offerFieldsSchema.extend({
  name: z.string().min(1).max(256),
});

export const offerDraftPublishSchema = z
  .object({
    kind: z.enum(['offer', 'request']),
    fields: publishFieldsSchema,
    legalText: z.string().max(65536),
  })
  .superRefine((data, ctx) => {
    if (data.fields.disputeRule === 'arbiter') {
      const arbiter = data.fields.arbiter?.trim() ?? '';
      if (arbiter.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'arbiter_required',
          path: ['fields', 'arbiter'],
        });
      }
    }
    const termination = data.fields.terms?.termination;
    if (termination?.mode === 'notice') {
      const days = termination.noticeDays;
      if (days === undefined || days <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'termination_notice_days_required',
          path: ['fields', 'terms', 'termination', 'noticeDays'],
        });
      }
    }
  });

export type PublishValidationResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<OfferEditorStep, string[]>> };

export type PublishErrorCode =
  | 'name_required'
  | 'arbiter_required'
  | 'termination_notice_days_required'
  | 'field_invalid';

function hasText(value: string | undefined | null): boolean {
  return (value?.trim() ?? '').length > 0;
}

function optionalText(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanSignParams(signParams: OfferSignParam[] | undefined): OfferSignParam[] | undefined {
  if (!signParams || signParams.length === 0) {
    return undefined;
  }
  const cleaned = signParams
    .map((item) => {
      const key = item.key?.trim() ?? '';
      const label = item.label?.trim() ?? '';
      if (!key || !label) {
        return null;
      }
      return {
        key,
        label,
        ...(item.required ? { required: true } : {}),
      };
    })
    .filter((item): item is OfferSignParam => item !== null);
  return cleaned.length > 0 ? cleaned : undefined;
}

function cleanTermination(termination: ReturnType<typeof getOfferTermination>) {
  const mode = termination.mode;
  const who = termination.who;
  const noticeDays = termination.noticeDays;
  const notes = optionalText(termination.notes);
  if (!mode && !who && noticeDays === undefined && !notes) {
    return undefined;
  }
  return {
    ...(mode ? { mode } : {}),
    ...(who ? { who } : {}),
    ...(noticeDays !== undefined ? { noticeDays } : {}),
    ...(notes ? { notes } : {}),
  };
}

/** Strip empty optional refs so Zod optional+min(1) fields do not fail on "". */
export function normalizeOfferDraftForPublish(state: OfferDraftState): OfferDraftState {
  const fields: OfferDraftFields = { ...state.fields };
  fields.name = fields.name?.trim() ?? '';
  fields.description = optionalText(fields.description);
  fields.serviceRef = optionalText(fields.serviceRef);
  fields.legalRef = optionalText(fields.legalRef);
  fields.offerId = optionalText(fields.offerId);
  fields.publishedOfferId = optionalText(fields.publishedOfferId);
  fields.billingNotes = optionalText(fields.billingNotes);
  fields.arbiter = hasText(fields.arbiter) ? fields.arbiter!.trim() : null;
  delete fields.terminationNotes;

  if (fields.tags) {
    const tags = fields.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    fields.tags = tags.length > 0 ? tags : undefined;
  }

  const terms = { ...getOfferTerms(fields) };
  terms.amountUsd = optionalText(terms.amountUsd);
  terms.currency = optionalText(terms.currency);
  terms.billingCycle = optionalText(terms.billingCycle);
  terms.signParams = cleanSignParams(terms.signParams);
  const cleanedTermination = cleanTermination(getOfferTermination(fields));
  if (cleanedTermination) {
    terms.termination = cleanedTermination;
  } else {
    delete terms.termination;
  }

  const hasTerms = Object.values(terms).some((value) => value !== undefined);
  fields.terms = hasTerms ? terms : undefined;

  return { ...state, fields };
}

function publishIssueStep(path: readonly PropertyKey[]): OfferEditorStep {
  const joined = path.map(String).join('.');
  if (
    joined.includes('name') ||
    joined.includes('description') ||
    joined.includes('tags') ||
    joined === 'kind'
  ) {
    return 'basics';
  }
  if (joined.includes('serviceRef') || joined.includes('signParams')) {
    return 'service';
  }
  if (joined.includes('terms') || joined.includes('pricingModel') || joined.includes('amountUsd')) {
    return 'commercial';
  }
  if (joined.includes('billingNotes') || joined.includes('billingCycle')) {
    return 'billing';
  }
  if (joined.includes('termination')) {
    return 'termination';
  }
  if (joined.includes('disputeRule') || joined.includes('arbiter')) {
    return 'disputes';
  }
  if (joined.includes('legalRef') || joined.includes('legalText')) {
    return 'legal';
  }
  return 'review';
}

function publishIssueCode(message: string, path: readonly PropertyKey[]): PublishErrorCode {
  const joined = path.map(String).join('.');
  if (message === 'arbiter_required' || joined.includes('arbiter')) {
    return 'arbiter_required';
  }
  if (message === 'termination_notice_days_required' || joined.includes('noticeDays')) {
    return 'termination_notice_days_required';
  }
  if (joined.includes('name')) {
    return 'name_required';
  }
  return 'field_invalid';
}

export function publishErrorMessageKey(code: string): string {
  switch (code as PublishErrorCode) {
    case 'name_required':
      return 'business_publish_error_name_required';
    case 'arbiter_required':
      return 'business_publish_error_arbiter_required';
    case 'termination_notice_days_required':
      return 'business_publish_error_termination_notice_days_required';
    default:
      return 'business_publish_error_field_invalid';
  }
}

export function listPublishBlockingSteps(
  result: PublishValidationResult,
): OfferEditorStep[] {
  if (result.ok) {
    return [];
  }
  return OFFER_EDITOR_STEPS.filter(
    (step) => step !== 'review' && (result.errors[step]?.length ?? 0) > 0,
  );
}

export function computeStepCompleteness(
  step: OfferEditorStep,
  state: OfferDraftState,
): StepCompleteness {
  const { kind, fields, legalText } = state;
  const terms = getOfferTerms(fields);
  const termination = getOfferTermination(fields);

  switch (step) {
    case 'basics': {
      const hasName = hasText(fields.name);
      const hasDesc = hasText(fields.description);
      if (!hasName && !hasDesc && (fields.tags?.length ?? 0) === 0) {
        return 'empty';
      }
      return hasName ? 'complete' : 'incomplete';
    }
    case 'service':
      return hasText(fields.serviceRef) ? 'complete' : 'empty';
    case 'commercial': {
      const hasPricing = hasText(terms.pricingModel);
      const hasAmount = hasText(terms.amountUsd);
      if (!hasPricing && !hasAmount && !hasText(terms.currency)) {
        return 'empty';
      }
      return hasPricing || hasAmount ? 'complete' : 'incomplete';
    }
    case 'billing': {
      const hasNotes = hasText(fields.billingNotes);
      const hasCycle = hasText(terms.billingCycle);
      if (!hasNotes && !hasCycle) {
        return 'empty';
      }
      return 'complete';
    }
    case 'termination': {
      if (!termination.mode) {
        return 'empty';
      }
      if (termination.mode === 'notice') {
        const days = termination.noticeDays;
        if (days === undefined || days <= 0) {
          return 'incomplete';
        }
      }
      return 'complete';
    }
    case 'disputes': {
      if (fields.disputeRule === 'arbiter') {
        return hasText(fields.arbiter) ? 'complete' : 'incomplete';
      }
      return fields.disputeRule ? 'complete' : 'incomplete';
    }
    case 'legal': {
      const hasLegal = hasText(fields.legalRef) || hasText(legalText);
      return hasLegal ? 'complete' : 'empty';
    }
    case 'review':
      return validateOfferDraftForPublish(state).ok ? 'complete' : 'incomplete';
    default:
      return 'empty';
  }
}

export function validateOfferDraftForPublish(state: OfferDraftState): PublishValidationResult {
  const normalized = normalizeOfferDraftForPublish(state);
  const parsed = offerDraftPublishSchema.safeParse(normalized);
  if (parsed.success) {
    return { ok: true };
  }

  const errors: Partial<Record<OfferEditorStep, string[]>> = {};

  const pushError = (step: OfferEditorStep, code: PublishErrorCode) => {
    const bucket = errors[step] ?? [];
    if (!bucket.includes(code)) {
      errors[step] = [...bucket, code];
    }
  };

  for (const issue of parsed.error.issues) {
    const step = publishIssueStep(issue.path);
    const code = publishIssueCode(issue.message, issue.path);
    pushError(step, code);
  }

  if (!hasText(normalized.fields.name)) {
    pushError('basics', 'name_required');
  }

  if (normalized.fields.disputeRule === 'arbiter' && !hasText(normalized.fields.arbiter)) {
    pushError('disputes', 'arbiter_required');
  }

  const termination = getOfferTermination(normalized.fields);
  if (termination.mode === 'notice') {
    const days = termination.noticeDays;
    if (days === undefined || days <= 0) {
      pushError('termination', 'termination_notice_days_required');
    }
  }

  return { ok: false, errors };
}

export function isPublishedOfferUpdate(fields: OfferDraftFields): boolean {
  return hasText(fields.publishedOfferId);
}

export function resolvePublishOfferId(
  fields: OfferDraftFields,
  draftId: string,
): string {
  if (hasText(fields.publishedOfferId)) {
    return fields.publishedOfferId!.trim();
  }
  if (hasText(fields.offerId)) {
    return fields.offerId!.trim();
  }
  return `offer-${draftId}`;
}

export function allEditorSteps(): readonly OfferEditorStep[] {
  return OFFER_EDITOR_STEPS;
}

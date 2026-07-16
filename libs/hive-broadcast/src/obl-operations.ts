import { buildCustomJsonOp } from './operation-builders';
import type { CustomJsonOp } from './hive-operations';

function optionalNonEmptyString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/** Update refs: omit when undefined, null clears, empty string → null. */
function optionalRefForUpdate(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

type OblEnvelopeAction =
  | 'offer_publish'
  | 'offer_update'
  | 'offer_retire'
  | 'contract_sign'
  | 'invoice_issue'
  | 'payment_declare'
  | 'payment_confirm'
  | 'dispute_open'
  | 'dispute_resolve';

export type BuildOblEnvelopeOpInput = {
  readonly id: string;
  readonly action: OblEnvelopeAction;
  readonly payload: Record<string, unknown>;
  readonly required_auths?: readonly string[];
  readonly required_posting_auths?: readonly string[];
};

export function buildOblEnvelopeOp(input: BuildOblEnvelopeOpInput): CustomJsonOp {
  const envelope = {
    events: [
      {
        action: input.action,
        v: 1,
        payload: input.payload,
      },
    ],
  };

  return buildCustomJsonOp({
    required_auths: input.required_auths ?? [],
    required_posting_auths: input.required_posting_auths ?? [],
    id: input.id,
    json: JSON.stringify(envelope),
  });
}

export type BuildOblOfferPublishOpInput = {
  readonly id: string;
  readonly offerId: string;
  readonly author: string;
  readonly kind: 'offer' | 'request';
  readonly name: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly serviceRef?: string;
  readonly legalRef?: string;
  readonly terms: Record<string, unknown>;
  readonly disputeRule: 'client' | 'provider' | 'arbiter';
  readonly arbiter?: string;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblOfferPublishOp(input: BuildOblOfferPublishOpInput): CustomJsonOp {
  const serviceRef = optionalNonEmptyString(input.serviceRef);
  const legalRef = optionalNonEmptyString(input.legalRef);
  const description = optionalNonEmptyString(input.description);
  const arbiter = optionalNonEmptyString(input.arbiter);

  return buildOblEnvelopeOp({
    id: input.id,
    action: 'offer_publish',
    required_posting_auths: input.required_posting_auths ?? [input.author],
    payload: {
      offer_id: input.offerId,
      author: input.author,
      kind: input.kind,
      name: input.name.trim(),
      ...(description !== undefined ? { description } : {}),
      ...(input.tags !== undefined ? { tags: [...input.tags] } : {}),
      ...(serviceRef !== undefined ? { service_ref: serviceRef } : {}),
      ...(legalRef !== undefined ? { legal_ref: legalRef } : {}),
      terms: input.terms,
      dispute_rule: input.disputeRule,
      ...(arbiter !== undefined ? { arbiter } : {}),
    },
  });
}

export type BuildOblOfferUpdateOpInput = {
  readonly id: string;
  readonly offerId: string;
  readonly author: string;
  readonly name?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly serviceRef?: string | null;
  readonly legalRef?: string | null;
  readonly terms?: Record<string, unknown>;
  readonly disputeRule?: 'client' | 'provider' | 'arbiter';
  readonly arbiter?: string | null;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblOfferUpdateOp(input: BuildOblOfferUpdateOpInput): CustomJsonOp {
  const serviceRef = optionalRefForUpdate(input.serviceRef);
  const legalRef = optionalRefForUpdate(input.legalRef);
  const description = optionalNonEmptyString(input.description);
  const arbiter = optionalRefForUpdate(input.arbiter);

  return buildOblEnvelopeOp({
    id: input.id,
    action: 'offer_update',
    required_posting_auths: input.required_posting_auths ?? [input.author],
    payload: {
      offer_id: input.offerId,
      author: input.author,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(input.tags !== undefined ? { tags: [...input.tags] } : {}),
      ...(serviceRef !== undefined ? { service_ref: serviceRef } : {}),
      ...(legalRef !== undefined ? { legal_ref: legalRef } : {}),
      ...(input.terms !== undefined ? { terms: input.terms } : {}),
      ...(input.disputeRule !== undefined ? { dispute_rule: input.disputeRule } : {}),
      ...(arbiter !== undefined ? { arbiter } : {}),
    },
  });
}

export type BuildOblOfferRetireOpInput = {
  readonly id: string;
  readonly offerId: string;
  readonly author: string;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblOfferRetireOp(input: BuildOblOfferRetireOpInput): CustomJsonOp {
  return buildOblEnvelopeOp({
    id: input.id,
    action: 'offer_retire',
    required_posting_auths: input.required_posting_auths ?? [input.author],
    payload: {
      offer_id: input.offerId,
      author: input.author,
    },
  });
}

export type BuildOblContractSignOpInput = {
  readonly id: string;
  readonly contractId: string;
  readonly offerId: string;
  readonly offerVersion: number;
  readonly provider: string;
  readonly client: string;
  readonly signer: string;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblContractSignOp(input: BuildOblContractSignOpInput): CustomJsonOp {
  return buildOblEnvelopeOp({
    id: input.id,
    action: 'contract_sign',
    required_posting_auths: input.required_posting_auths ?? [input.signer],
    payload: {
      contract_id: input.contractId,
      offer_id: input.offerId,
      offer_version: input.offerVersion,
      provider: input.provider,
      client: input.client,
      signer: input.signer,
    },
  });
}

export type BuildOblInvoiceIssueOpInput = {
  readonly id: string;
  readonly invoiceId: string;
  readonly issuer: string;
  readonly debtor: string;
  readonly creditor: string;
  readonly amountUsd: number | string;
  readonly contractId?: string;
  readonly details?: Record<string, unknown>;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblInvoiceIssueOp(input: BuildOblInvoiceIssueOpInput): CustomJsonOp {
  return buildOblEnvelopeOp({
    id: input.id,
    action: 'invoice_issue',
    required_posting_auths: input.required_posting_auths ?? [input.issuer],
    payload: {
      invoice_id: input.invoiceId,
      issuer: input.issuer,
      debtor: input.debtor,
      creditor: input.creditor,
      amount_usd: input.amountUsd,
      ...(input.contractId !== undefined ? { contract_id: input.contractId } : {}),
      ...(input.details !== undefined ? { details: input.details } : {}),
    },
  });
}

export type BuildOblPaymentDeclareOpInput = {
  readonly id: string;
  readonly paymentId: string;
  readonly payer: string;
  readonly receiver: string;
  readonly amountUsd: number | string;
  readonly contractId?: string;
  readonly ref?: Record<string, unknown>;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblPaymentDeclareOp(input: BuildOblPaymentDeclareOpInput): CustomJsonOp {
  return buildOblEnvelopeOp({
    id: input.id,
    action: 'payment_declare',
    required_posting_auths: input.required_posting_auths ?? [input.payer],
    payload: {
      payment_id: input.paymentId,
      payer: input.payer,
      receiver: input.receiver,
      amount_usd: input.amountUsd,
      ...(input.contractId !== undefined ? { contract_id: input.contractId } : {}),
      ...(input.ref !== undefined ? { ref: input.ref } : {}),
    },
  });
}

export type BuildOblPaymentConfirmOpInput = {
  readonly id: string;
  readonly paymentId: string;
  readonly receiver: string;
  readonly amountUsd: number | string;
  readonly payer?: string;
  readonly declarePaymentId?: string;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblPaymentConfirmOp(input: BuildOblPaymentConfirmOpInput): CustomJsonOp {
  return buildOblEnvelopeOp({
    id: input.id,
    action: 'payment_confirm',
    required_posting_auths: input.required_posting_auths ?? [input.receiver],
    payload: {
      payment_id: input.paymentId,
      receiver: input.receiver,
      amount_usd: input.amountUsd,
      ...(input.payer !== undefined ? { payer: input.payer } : {}),
      ...(input.declarePaymentId !== undefined
        ? { declare_payment_id: input.declarePaymentId }
        : {}),
    },
  });
}

export type BuildOblDisputeOpenOpInput = {
  readonly id: string;
  readonly disputeId: string;
  readonly invoiceId: string;
  readonly disputant: string;
  readonly proposedAmountUsd: number | string;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblDisputeOpenOp(input: BuildOblDisputeOpenOpInput): CustomJsonOp {
  return buildOblEnvelopeOp({
    id: input.id,
    action: 'dispute_open',
    required_posting_auths: input.required_posting_auths ?? [input.disputant],
    payload: {
      dispute_id: input.disputeId,
      invoice_id: input.invoiceId,
      disputant: input.disputant,
      proposed_amount_usd: input.proposedAmountUsd,
    },
  });
}

export type BuildOblDisputeResolveOpInput = {
  readonly id: string;
  readonly disputeId: string;
  readonly resolver: string;
  readonly finalAmountUsd: number | string;
  readonly required_posting_auths?: readonly string[];
};

export function buildOblDisputeResolveOp(input: BuildOblDisputeResolveOpInput): CustomJsonOp {
  return buildOblEnvelopeOp({
    id: input.id,
    action: 'dispute_resolve',
    required_posting_auths: input.required_posting_auths ?? [input.resolver],
    payload: {
      dispute_id: input.disputeId,
      resolver: input.resolver,
      final_amount_usd: input.finalAmountUsd,
    },
  });
}

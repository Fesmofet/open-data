import {
  buildOblContractSignOp,
  buildOblDisputeOpenOp,
  buildOblDisputeResolveOp,
  buildOblInvoiceIssueOp,
  buildOblOfferPublishOp,
  buildOblOfferRetireOp,
  buildOblOfferUpdateOp,
  buildOblPaymentConfirmOp,
  buildOblPaymentDeclareOp,
} from '@opden-data-layer/hive-broadcast';

import type { OfferDraftFields } from '../domain/offer-form.types';

export function buildPublishOfferOp(input: {
  oblCustomJsonId: string;
  author: string;
  kind: 'offer' | 'request';
  fields: OfferDraftFields;
}) {
  const offerId = input.fields.offerId ?? `obl-offer-${Date.now()}`;
  return buildOblOfferPublishOp({
    id: input.oblCustomJsonId,
    offerId,
    author: input.author,
    kind: input.kind,
    name: input.fields.name ?? 'Untitled',
    description: input.fields.description,
    tags: input.fields.tags,
    serviceRef: input.fields.serviceRef,
    legalRef: input.fields.legalRef,
    terms: input.fields.terms ?? {},
    disputeRule: input.fields.disputeRule ?? 'client',
    arbiter: input.fields.arbiter ?? undefined,
    required_posting_auths: [input.author],
  });
}

export function buildUpdateOfferOp(input: {
  oblCustomJsonId: string;
  author: string;
  offerId: string;
  fields: OfferDraftFields;
}) {
  return buildOblOfferUpdateOp({
    id: input.oblCustomJsonId,
    offerId: input.offerId,
    author: input.author,
    name: input.fields.name,
    description: input.fields.description,
    tags: input.fields.tags,
    serviceRef: input.fields.serviceRef,
    legalRef: input.fields.legalRef,
    terms: input.fields.terms,
    disputeRule: input.fields.disputeRule,
    arbiter: input.fields.arbiter,
    required_posting_auths: [input.author],
  });
}

export function buildRetireOfferOp(input: {
  oblCustomJsonId: string;
  author: string;
  offerId: string;
}) {
  return buildOblOfferRetireOp({
    id: input.oblCustomJsonId,
    offerId: input.offerId,
    author: input.author,
    required_posting_auths: [input.author],
  });
}

export function buildSignContractOp(input: {
  oblCustomJsonId: string;
  contractId: string;
  offerId: string;
  offerVersion: number;
  provider: string;
  client: string;
  signer: string;
}) {
  return buildOblContractSignOp({
    id: input.oblCustomJsonId,
    contractId: input.contractId,
    offerId: input.offerId,
    offerVersion: input.offerVersion,
    provider: input.provider,
    client: input.client,
    signer: input.signer,
    required_posting_auths: [input.signer],
  });
}

export function buildIssueInvoiceOp(input: {
  oblCustomJsonId: string;
  invoiceId: string;
  issuer: string;
  debtor: string;
  creditor: string;
  amountUsd: string;
  contractId?: string;
  details?: Record<string, unknown>;
}) {
  return buildOblInvoiceIssueOp({
    id: input.oblCustomJsonId,
    invoiceId: input.invoiceId,
    issuer: input.issuer,
    debtor: input.debtor,
    creditor: input.creditor,
    amountUsd: input.amountUsd,
    contractId: input.contractId,
    details: input.details,
    required_posting_auths: [input.issuer],
  });
}

export function buildDeclarePaymentOp(input: {
  oblCustomJsonId: string;
  paymentId: string;
  payer: string;
  receiver: string;
  amountUsd: string;
}) {
  return buildOblPaymentDeclareOp({
    id: input.oblCustomJsonId,
    paymentId: input.paymentId,
    payer: input.payer,
    receiver: input.receiver,
    amountUsd: input.amountUsd,
    required_posting_auths: [input.payer],
  });
}

export function buildConfirmPaymentOp(input: {
  oblCustomJsonId: string;
  paymentId: string;
  receiver: string;
  amountUsd: string;
  payer?: string;
  declarePaymentId?: string;
}) {
  return buildOblPaymentConfirmOp({
    id: input.oblCustomJsonId,
    paymentId: input.paymentId,
    receiver: input.receiver,
    amountUsd: input.amountUsd,
    payer: input.payer,
    declarePaymentId: input.declarePaymentId,
    required_posting_auths: [input.receiver],
  });
}

export function buildOpenDisputeOp(input: {
  oblCustomJsonId: string;
  disputeId: string;
  invoiceId: string;
  disputant: string;
  proposedAmountUsd: string;
}) {
  return buildOblDisputeOpenOp({
    id: input.oblCustomJsonId,
    disputeId: input.disputeId,
    invoiceId: input.invoiceId,
    disputant: input.disputant,
    proposedAmountUsd: input.proposedAmountUsd,
    required_posting_auths: [input.disputant],
  });
}

export function buildResolveDisputeOp(input: {
  oblCustomJsonId: string;
  disputeId: string;
  resolver: string;
  finalAmountUsd: string;
}) {
  return buildOblDisputeResolveOp({
    id: input.oblCustomJsonId,
    disputeId: input.disputeId,
    resolver: input.resolver,
    finalAmountUsd: input.finalAmountUsd,
    required_posting_auths: [input.resolver],
  });
}

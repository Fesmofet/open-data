/** Deterministic contract id: one contract per offer + account pair. */
export function deterministicContractId(
  offerId: string,
  accountA: string,
  accountB: string,
): string {
  const [low, high] = [accountA, accountB].sort();
  return `contract-${offerId}-${low}-${high}`;
}

function newUuid(): string {
  return crypto.randomUUID();
}

function prefixedId(prefix: string, uuid: string): string {
  return `${prefix}${uuid}`;
}

/** Client-generated invoice id: `inv-{uuid}`. */
export function newOblInvoiceId(uuid = newUuid()): string {
  return prefixedId('inv-', uuid);
}

/** Client-generated payment_declare id: `pay-{uuid}`. */
export function newOblPaymentDeclareId(uuid = newUuid()): string {
  return prefixedId('pay-', uuid);
}

/** Client-generated payment_confirm id: `pay-recv-{uuid}`. */
export function newOblPaymentConfirmId(uuid = newUuid()): string {
  return prefixedId('pay-recv-', uuid);
}

/** Client-generated dispute id: `dispute-{uuid}`. */
export function newOblDisputeId(uuid = newUuid()): string {
  return prefixedId('dispute-', uuid);
}

/** Client-generated service order id: `service-order-{uuid}`. */
export function newOblServiceOrderId(uuid = newUuid()): string {
  return prefixedId('service-order-', uuid);
}

/** Client-generated report id: `report-{uuid}`. */
export function newOblReportId(uuid = newUuid()): string {
  return prefixedId('report-', uuid);
}

/** Client-generated offer id when not reusing a draft id: `obl-offer-{uuid}`. */
export function newOblOfferId(uuid = newUuid()): string {
  return prefixedId('obl-offer-', uuid);
}

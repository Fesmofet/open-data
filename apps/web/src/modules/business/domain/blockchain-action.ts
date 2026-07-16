export type BlockchainActionPhase =
  | 'drafting'
  | 'review'
  | 'wallet'
  | 'broadcast'
  | 'indexing'
  | 'confirmed'
  | 'failed';

export type BlockchainActionKind =
  | 'offer_publish'
  | 'offer_update'
  | 'offer_retire'
  | 'contract_sign'
  | 'invoice_issue'
  | 'payment_declare'
  | 'payment_confirm'
  | 'dispute_open'
  | 'dispute_resolve';

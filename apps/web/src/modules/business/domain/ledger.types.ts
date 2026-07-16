export type DirectionalUsdView = {
  owesAtoB: string;
  owesBtoA: string;
  netUsd: string;
};

export type PairBalanceView = {
  accountA: string;
  accountB: string;
  confirmed: DirectionalUsdView;
  pending: DirectionalUsdView;
  disputed: DirectionalUsdView;
};

export type OblOfferSummary = {
  offerId: string;
  version: number;
  kind: 'offer' | 'request';
  author: string;
  name: string;
  description: string | null;
  tags: string[];
  status: 'active' | 'retired';
  disputeRule: 'client' | 'provider' | 'arbiter';
  arbiter: string | null;
};

export type OblLedgerView = {
  accountA: string;
  accountB: string;
  startedEventSeq: string | null;
  balance: PairBalanceView;
  contractCount: number;
  invoiceCount: number;
  paymentCount: number;
  disputeCount: number;
};

export type OblRelationshipRow = {
  counterparty: string;
  roles: Array<'provider' | 'client'>;
  contractCount: number;
  balance: PairBalanceView;
  lastActivityAt: string | null;
};

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Open Business Layer (OBL) on-chain ledger tables + off-chain offer drafts.
 * @see docs/spec/open-business-layer.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

  await sql`
    CREATE TABLE obl_offers (
      offer_id           TEXT NOT NULL,
      version            INTEGER NOT NULL,
      kind               TEXT NOT NULL CHECK (kind IN ('offer','request')),
      author             TEXT NOT NULL,
      name               TEXT NOT NULL,
      description        TEXT,
      tags               TEXT[] NOT NULL DEFAULT '{}',
      service_ref        TEXT,
      legal_ref          TEXT,
      terms              JSONB NOT NULL,
      dispute_rule       TEXT NOT NULL CHECK (dispute_rule IN ('client','provider','arbiter')),
      arbiter            TEXT,
      status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired')),
      created_event_seq  BIGINT NOT NULL,
      transaction_id     TEXT NOT NULL,
      PRIMARY KEY (offer_id, version)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_offers_author_kind_status
    ON obl_offers (author, kind, status)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_offers_tags_gin
    ON obl_offers USING GIN (tags)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_offers_name_trgm
    ON obl_offers USING GIN (name gin_trgm_ops)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_offers_description_trgm
    ON obl_offers USING GIN (description gin_trgm_ops)
  `.execute(db);

  await sql`
    CREATE TABLE obl_contracts (
      contract_id        TEXT PRIMARY KEY,
      offer_id           TEXT NOT NULL,
      offer_version      INTEGER NOT NULL,
      provider           TEXT NOT NULL,
      client             TEXT NOT NULL,
      dispute_rule       TEXT NOT NULL,
      arbiter            TEXT,
      pair_low           TEXT GENERATED ALWAYS AS (LEAST(provider, client)) STORED,
      pair_high          TEXT GENERATED ALWAYS AS (GREATEST(provider, client)) STORED,
      created_event_seq  BIGINT NOT NULL,
      transaction_id     TEXT NOT NULL,
      FOREIGN KEY (offer_id, offer_version) REFERENCES obl_offers (offer_id, version)
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_contracts_pair
    ON obl_contracts (pair_low, pair_high)
  `.execute(db);

  await sql`
    CREATE TABLE obl_invoices (
      invoice_id         TEXT PRIMARY KEY,
      contract_id        TEXT,
      issuer             TEXT NOT NULL,
      debtor             TEXT NOT NULL,
      creditor           TEXT NOT NULL,
      amount_usd         NUMERIC(20,8) NOT NULL,
      final_amount_usd   NUMERIC(20,8),
      details            JSONB NOT NULL DEFAULT '{}',
      state              TEXT NOT NULL CHECK (state IN ('confirmed','pending','disputed','resolved','void')),
      pair_low           TEXT GENERATED ALWAYS AS (LEAST(debtor, creditor)) STORED,
      pair_high          TEXT GENERATED ALWAYS AS (GREATEST(debtor, creditor)) STORED,
      created_event_seq  BIGINT NOT NULL,
      transaction_id     TEXT NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_invoices_pair_state
    ON obl_invoices (pair_low, pair_high, state)
  `.execute(db);

  await sql`
    CREATE TABLE obl_ledgers (
      pair_low           TEXT NOT NULL,
      pair_high          TEXT NOT NULL,
      started_event_seq  BIGINT NOT NULL,
      PRIMARY KEY (pair_low, pair_high)
    )
  `.execute(db);

  await sql`
    CREATE TABLE obl_payments (
      payment_id         TEXT PRIMARY KEY,
      payer              TEXT NOT NULL,
      receiver           TEXT NOT NULL,
      amount_usd         NUMERIC(20,8) NOT NULL,
      method             TEXT NOT NULL CHECK (method IN ('token_transfer','upvote_reward','offchain')),
      token_symbol       TEXT,
      token_amount       TEXT,
      rate_usd           NUMERIC(38,18),
      state              TEXT NOT NULL CHECK (state IN ('confirmed','pending')),
      contract_id        TEXT,
      ref                JSONB,
      pair_low           TEXT GENERATED ALWAYS AS (LEAST(payer, receiver)) STORED,
      pair_high          TEXT GENERATED ALWAYS AS (GREATEST(payer, receiver)) STORED,
      created_event_seq  BIGINT NOT NULL,
      transaction_id     TEXT
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_payments_pair_state
    ON obl_payments (pair_low, pair_high, state)
  `.execute(db);

  await sql`
    CREATE TABLE obl_disputes (
      dispute_id          TEXT PRIMARY KEY,
      invoice_id          TEXT NOT NULL REFERENCES obl_invoices (invoice_id),
      disputant           TEXT NOT NULL,
      proposed_amount_usd NUMERIC(20,8) NOT NULL,
      status              TEXT NOT NULL CHECK (status IN ('open','resolved')),
      final_amount_usd    NUMERIC(20,8),
      resolver            TEXT,
      created_event_seq   BIGINT NOT NULL,
      resolved_event_seq  BIGINT,
      transaction_id      TEXT NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_disputes_invoice_status
    ON obl_disputes (invoice_id, status)
  `.execute(db);

  await sql`
    CREATE TABLE obl_offer_drafts (
      author        TEXT NOT NULL,
      draft_id      TEXT NOT NULL,
      kind          TEXT NOT NULL CHECK (kind IN ('offer','request')),
      fields        JSONB NOT NULL DEFAULT '{}',
      legal_text    TEXT,
      last_updated  INTEGER NOT NULL,
      PRIMARY KEY (author, draft_id)
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS obl_offer_drafts`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_disputes`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_payments`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_ledgers`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_invoices`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_contracts`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_offers_description_trgm`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_offers_name_trgm`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_offers_tags_gin`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_offers_author_kind_status`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_offers`.execute(db);
}

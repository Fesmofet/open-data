import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * OBL obligation lines: single source for netting; obl_invoices becomes header-only.
 * Down migration restores only the first line (`invoice_id:0`) per invoice — multi-line
 * invoices lose extra lines on rollback (acceptable for testing-only environments).
 * @see docs/spec/obl/mutual-ledger.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE obl_obligation_lines (
      line_id            TEXT PRIMARY KEY,
      invoice_id         TEXT NOT NULL REFERENCES obl_invoices (invoice_id),
      debtor             TEXT NOT NULL,
      beneficiary        TEXT NOT NULL,
      amount_usd         NUMERIC(20,8) NOT NULL,
      final_amount_usd   NUMERIC(20,8),
      state              TEXT NOT NULL CHECK (state IN ('confirmed','pending','disputed','resolved','void')),
      dispute_group      TEXT NOT NULL,
      role               TEXT,
      pair_low           TEXT GENERATED ALWAYS AS (LEAST(debtor, beneficiary)) STORED,
      pair_high          TEXT GENERATED ALWAYS AS (GREATEST(debtor, beneficiary)) STORED,
      created_event_seq  BIGINT NOT NULL,
      transaction_id     TEXT NOT NULL,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_lines_pair_state
    ON obl_obligation_lines (pair_low, pair_high, state)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_lines_invoice
    ON obl_obligation_lines (invoice_id)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_lines_pair_created
    ON obl_obligation_lines (pair_low, pair_high, created_event_seq DESC, line_id DESC)
  `.execute(db);

  await sql`
    ALTER TABLE obl_invoices
    ADD COLUMN kind TEXT NOT NULL DEFAULT 'single' CHECK (kind IN ('single','multi'))
  `.execute(db);

  await sql`
    INSERT INTO obl_obligation_lines (
      line_id,
      invoice_id,
      debtor,
      beneficiary,
      amount_usd,
      final_amount_usd,
      state,
      dispute_group,
      created_event_seq,
      transaction_id,
      created_at
    )
    SELECT
      invoice_id || ':0',
      invoice_id,
      debtor,
      creditor,
      amount_usd,
      final_amount_usd,
      state,
      invoice_id,
      created_event_seq,
      transaction_id,
      created_at
    FROM obl_invoices
  `.execute(db);

  await sql`DROP INDEX IF EXISTS idx_obl_invoices_pair_state`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_obl_invoices_pair_created`.execute(db);

  // Drop generated pair columns before creditor (they depend on creditor).
  await sql`
    ALTER TABLE obl_invoices
      DROP COLUMN pair_low,
      DROP COLUMN pair_high
  `.execute(db);

  await sql`
    ALTER TABLE obl_invoices
      DROP COLUMN creditor,
      DROP COLUMN amount_usd,
      DROP COLUMN final_amount_usd,
      DROP COLUMN state
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE obl_invoices
      ADD COLUMN creditor TEXT,
      ADD COLUMN amount_usd NUMERIC(20,8),
      ADD COLUMN final_amount_usd NUMERIC(20,8),
      ADD COLUMN state TEXT CHECK (state IN ('confirmed','pending','disputed','resolved','void')),
      ADD COLUMN pair_low TEXT GENERATED ALWAYS AS (LEAST(debtor, creditor)) STORED,
      ADD COLUMN pair_high TEXT GENERATED ALWAYS AS (GREATEST(debtor, creditor)) STORED
  `.execute(db);

  await sql`
    UPDATE obl_invoices i
    SET
      creditor = l.beneficiary,
      amount_usd = l.amount_usd,
      final_amount_usd = l.final_amount_usd,
      state = l.state
    FROM obl_obligation_lines l
    WHERE l.invoice_id = i.invoice_id
      AND l.line_id = i.invoice_id || ':0'
  `.execute(db);

  await sql`
    ALTER TABLE obl_invoices
      ALTER COLUMN creditor SET NOT NULL,
      ALTER COLUMN amount_usd SET NOT NULL,
      ALTER COLUMN state SET NOT NULL
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_invoices_pair_state
    ON obl_invoices (pair_low, pair_high, state)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_invoices_pair_created
    ON obl_invoices (pair_low, pair_high, created_event_seq DESC, invoice_id DESC)
  `.execute(db);

  await sql`ALTER TABLE obl_invoices DROP COLUMN IF EXISTS kind`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_obligation_lines`.execute(db);
}

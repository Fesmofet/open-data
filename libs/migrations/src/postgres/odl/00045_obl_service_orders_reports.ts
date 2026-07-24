import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * OBL service orders, reports, and invoice cross-references.
 * @see docs/spec/obl/service-orders.md
 * @see docs/spec/obl/reports.md
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE obl_service_orders (
      service_order_id   TEXT PRIMARY KEY,
      contract_id        TEXT NOT NULL REFERENCES obl_contracts (contract_id),
      creator            TEXT NOT NULL,
      provider           TEXT NOT NULL,
      client             TEXT NOT NULL,
      pair_low           TEXT GENERATED ALWAYS AS (LEAST(provider, client)) STORED,
      pair_high          TEXT GENERATED ALWAYS AS (GREATEST(provider, client)) STORED,
      details            JSONB NOT NULL DEFAULT '{}',
      created_event_seq  BIGINT NOT NULL,
      transaction_id     TEXT NOT NULL,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_service_orders_contract_created
    ON obl_service_orders (contract_id, created_event_seq DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_service_orders_pair_created
    ON obl_service_orders (pair_low, pair_high, created_at DESC, created_event_seq DESC)
  `.execute(db);

  await sql`
    CREATE TABLE obl_reports (
      report_id          TEXT PRIMARY KEY,
      contract_id        TEXT REFERENCES obl_contracts (contract_id),
      service_order_id   TEXT REFERENCES obl_service_orders (service_order_id),
      author             TEXT NOT NULL,
      provider           TEXT NOT NULL,
      client             TEXT NOT NULL,
      pair_low           TEXT GENERATED ALWAYS AS (LEAST(provider, client)) STORED,
      pair_high          TEXT GENERATED ALWAYS AS (GREATEST(provider, client)) STORED,
      details            JSONB NOT NULL DEFAULT '{}',
      created_event_seq  BIGINT NOT NULL,
      transaction_id     TEXT NOT NULL,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_reports_contract_created
    ON obl_reports (contract_id, created_event_seq DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_reports_pair_created
    ON obl_reports (pair_low, pair_high, created_at DESC, created_event_seq DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_obl_reports_service_order
    ON obl_reports (service_order_id)
    WHERE service_order_id IS NOT NULL
  `.execute(db);

  await sql`
    ALTER TABLE obl_invoices
    ADD COLUMN service_order_id TEXT REFERENCES obl_service_orders (service_order_id),
    ADD COLUMN report_id TEXT REFERENCES obl_reports (report_id)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE obl_invoices
    DROP COLUMN IF EXISTS service_order_id,
    DROP COLUMN IF EXISTS report_id
  `.execute(db);

  await sql`DROP TABLE IF EXISTS obl_reports`.execute(db);
  await sql`DROP TABLE IF EXISTS obl_service_orders`.execute(db);
}

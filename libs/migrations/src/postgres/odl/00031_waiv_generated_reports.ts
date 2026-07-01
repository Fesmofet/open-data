import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/** Async WAIV advanced report jobs and persisted row snapshots. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE waiv_generated_reports (
      id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner                   TEXT NOT NULL,
      profile_account         TEXT NOT NULL,
      status                  TEXT NOT NULL,
      currency                TEXT NOT NULL,
      start_date_ts           INTEGER NOT NULL,
      end_date_ts             INTEGER NOT NULL,
      filter_accounts         TEXT[] NOT NULL,
      include_swaps_and_trades BOOLEAN NOT NULL DEFAULT false,
      merge_rewards           BOOLEAN NOT NULL DEFAULT true,
      accounts_progress       JSONB NOT NULL DEFAULT '[]'::jsonb,
      deposits                NUMERIC(20, 4) NOT NULL DEFAULT 0,
      withdrawals             NUMERIC(20, 4) NOT NULL DEFAULT 0,
      row_count               INTEGER NOT NULL DEFAULT 0,
      error_message           TEXT,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at            TIMESTAMPTZ
    )
  `.execute(db);

  await sql`
    CREATE INDEX idx_waiv_generated_reports_owner_created
    ON waiv_generated_reports (owner, created_at DESC)
  `.execute(db);

  await sql`
    CREATE INDEX idx_waiv_generated_reports_owner_status
    ON waiv_generated_reports (owner, status)
    WHERE status IN ('pending', 'in_progress')
  `.execute(db);

  await sql`
    CREATE TABLE waiv_generated_report_rows (
      id                BIGSERIAL PRIMARY KEY,
      report_id         UUID NOT NULL REFERENCES waiv_generated_reports (id) ON DELETE CASCADE,
      operation_index   INTEGER NOT NULL,
      timestamp         INTEGER NOT NULL,
      user_name         TEXT NOT NULL,
      checked           BOOLEAN NOT NULL DEFAULT false,
      row               JSONB NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX uq_waiv_generated_report_rows_report_operation
    ON waiv_generated_report_rows (report_id, operation_index)
  `.execute(db);

  await sql`
    CREATE INDEX idx_waiv_generated_report_rows_report_ts
    ON waiv_generated_report_rows (report_id, timestamp DESC, id DESC)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_waiv_generated_report_rows_report_ts`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS uq_waiv_generated_report_rows_report_operation`.execute(
    db,
  );
  await sql`DROP TABLE IF EXISTS waiv_generated_report_rows`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_waiv_generated_reports_owner_status`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS idx_waiv_generated_reports_owner_created`.execute(
    db,
  );
  await sql`DROP TABLE IF EXISTS waiv_generated_reports`.execute(db);
}

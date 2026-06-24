import type { OdlDatabase } from '../../../libs/core/src/db';
import { Kysely, sql } from 'kysely';

async function logDeletedRows(label: string): Promise<void> {
  console.log(`${label}: done`);
}

export async function dedupeHiveEngineDailyRates(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  await sql`
    DELETE FROM hive_engine_rates a
    USING hive_engine_rates b
    WHERE a.is_daily = true
      AND b.is_daily = true
      AND a.base = b.base
      AND a.date = b.date
      AND a.id > b.id
  `.execute(db);
  await logDeletedRows('hive_engine_rates daily dedupe');
}

export async function dedupeCurrencyStatisticsDaily(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  await sql`
    DELETE FROM currency_statistics a
    USING currency_statistics b
    WHERE a.is_daily = true
      AND b.is_daily = true
      AND ((a.created_at AT TIME ZONE 'UTC')::date) =
          ((b.created_at AT TIME ZONE 'UTC')::date)
      AND a.id > b.id
  `.execute(db);
  await logDeletedRows('currency_statistics daily dedupe');
}

export async function dedupeCurrencyRates(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  await sql`
    DELETE FROM currency_rates a
    USING currency_rates b
    WHERE a.base = b.base
      AND a.date = b.date
      AND a.id > b.id
  `.execute(db);
  await logDeletedRows('currency_rates dedupe');
}

export async function dropCurrencyStatisticsBulkIndexes(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  console.log('Dropping currency_statistics indexes...');
  await sql`DROP INDEX IF EXISTS idx_currency_statistics_daily_date`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_currency_statistics_is_daily_created_at`.execute(db);
  console.log('Indexes dropped.');
}

export async function recreateCurrencyStatisticsBulkIndexes(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  await dedupeCurrencyStatisticsDaily(db);
  console.log('Recreating currency_statistics indexes...');
  await sql`
    CREATE INDEX idx_currency_statistics_is_daily_created_at
    ON currency_statistics (is_daily, created_at DESC)
  `.execute(db);
  await sql`
    CREATE UNIQUE INDEX idx_currency_statistics_daily_date
    ON currency_statistics (((created_at AT TIME ZONE 'UTC')::date))
    WHERE is_daily = true
  `.execute(db);
  console.log('Indexes recreated.');
}

export async function dropHiveEngineRatesBulkIndexes(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  console.log('Dropping hive_engine_rates indexes...');
  await sql`DROP INDEX IF EXISTS idx_hive_engine_rates_daily_unique`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_hive_engine_rates_base_daily_date`.execute(db);
  console.log('Indexes dropped.');
}

export async function recreateHiveEngineRatesBulkIndexes(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  await dedupeHiveEngineDailyRates(db);
  console.log('Recreating hive_engine_rates indexes...');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_hive_engine_rates_base_daily_date
    ON hive_engine_rates (base, is_daily, date DESC)
  `.execute(db);
  await sql`
    CREATE UNIQUE INDEX idx_hive_engine_rates_daily_unique
    ON hive_engine_rates (base, date)
    WHERE is_daily = true
  `.execute(db);
  console.log('Indexes recreated.');
}

export async function dropCurrencyRatesBulkIndexes(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  console.log('Dropping currency_rates indexes...');
  await sql`DROP INDEX IF EXISTS idx_currency_rates_base_date`.execute(db);
  console.log('Indexes dropped.');
}

export async function recreateCurrencyRatesBulkIndexes(
  db: Kysely<OdlDatabase>,
): Promise<void> {
  await dedupeCurrencyRates(db);
  console.log('Recreating currency_rates indexes...');
  await sql`
    CREATE UNIQUE INDEX idx_currency_rates_base_date ON currency_rates (base, date)
  `.execute(db);
  console.log('Indexes recreated.');
}

import type {
  AccountsCurrentRow,
  ObjectUpdatesRow,
  ObjectsCoreRow,
  RankVotesRow,
  ValidityVotesRow,
} from './tables';

/**
 * Kysely database type for the ODL PostgreSQL schema.
 * Use with: new Kysely<OdlDatabase>({ dialect: new PostgresDialect({ pool }) })
 * @see https://kysely.dev/docs
 */
export interface OdlDatabase {
  objects_core: ObjectsCoreRow;
  object_updates: ObjectUpdatesRow;
  validity_votes: ValidityVotesRow;
  rank_votes: RankVotesRow;
  accounts_current: AccountsCurrentRow;
}

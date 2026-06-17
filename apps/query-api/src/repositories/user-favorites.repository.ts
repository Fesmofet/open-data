import { Injectable, Inject, Logger } from '@nestjs/common';
import { FAVORITES_OBJECT_TYPES } from '@opden-data-layer/core';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';

export type FavoritesScopeParams = {
  account: string;
  hideFavoriteObjects: boolean;
  shopDeselectObjectIds: readonly string[];
};

function favoritesTypeListSql() {
  return sql.join(
    FAVORITES_OBJECT_TYPES.map((t) => sql`${t}`),
    sql`, `,
  );
}

function postLinkedPredicate(
  account: string,
  includePostObjects: boolean,
  shopDeselectIds: readonly string[],
) {
  if (!includePostObjects) {
    return sql`FALSE`;
  }
  const deselectClause =
    shopDeselectIds.length === 0
      ? sql`TRUE`
      : sql`NOT (po.object_id IN (${sql.join(
          shopDeselectIds.map((id) => sql`${id}`),
          sql`, `,
        )}))`;
  return sql`po.author = ${account.trim()} AND po.object_type IN (${favoritesTypeListSql()}) AND (${deselectClause})`;
}

@Injectable()
export class UserFavoritesRepository {
  private readonly logger = new Logger(UserFavoritesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  private scopedObjectsCte(scope: FavoritesScopeParams, objectTypeFilter?: string) {
    const account = scope.account.trim();
    const includePost = !scope.hideFavoriteObjects;
    const postPred = postLinkedPredicate(account, includePost, scope.shopDeselectObjectIds);
    const typeFilter =
      objectTypeFilter != null && objectTypeFilter.trim().length > 0
        ? sql`AND oc.object_type = ${objectTypeFilter.trim()}`
        : sql``;

    return sql`
      WITH authority_objects AS (
        SELECT DISTINCT oc.object_id, oc.object_type, oc.weight
        FROM objects_core oc
        INNER JOIN object_authority oa ON oa.object_id = oc.object_id
          AND oa.account = ${account}
          AND oa.authority_type = 'administrative'
          AND oc.object_type IN (${favoritesTypeListSql()})
          AND oc.status = 'active'
          ${typeFilter}
      ),
      post_linked_objects AS (
        SELECT DISTINCT oc.object_id, oc.object_type, oc.weight
        FROM post_objects po
        INNER JOIN objects_core oc ON oc.object_id = po.object_id
          AND oc.status = 'active'
          AND oc.object_type IN (${favoritesTypeListSql()})
          ${typeFilter}
        WHERE (${postPred})
      ),
      scoped_objects AS (
        SELECT object_id, object_type, weight FROM authority_objects
        UNION
        SELECT object_id, object_type, weight FROM post_linked_objects
      ),
      distinct_objects AS (
        SELECT object_id, MAX(weight) AS weight, MIN(object_type) AS object_type
        FROM scoped_objects
        GROUP BY object_id
      )
    `;
  }

  async countByScope(scope: FavoritesScopeParams, objectType?: string): Promise<number> {
    const account = scope.account.trim();
    if (account.length === 0) {
      return 0;
    }
    try {
      const cte = this.scopedObjectsCte(scope, objectType);
      const row = await sql<{ c: number }>`
        ${cte}
        SELECT count(*)::int AS c FROM distinct_objects
      `.execute(this.db);
      return Number(row.rows[0]?.c ?? 0);
    } catch (error) {
      this.logger.error(
        `countByScope failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  async findObjectIdsByScope(
    scope: FavoritesScopeParams,
    objectType: string | undefined,
    skip: number,
    limit: number,
  ): Promise<string[]> {
    const account = scope.account.trim();
    if (account.length === 0 || limit <= 0) {
      return [];
    }
    try {
      const cte = this.scopedObjectsCte(scope, objectType);
      const rows = await sql<{ object_id: string }>`
        ${cte}
        SELECT object_id
        FROM distinct_objects
        ORDER BY weight DESC NULLS LAST, object_id ASC
        OFFSET ${skip}
        LIMIT ${limit}
      `.execute(this.db);
      return rows.rows.map((r) => r.object_id);
    } catch (error) {
      this.logger.error(
        `findObjectIdsByScope failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  async findTypesByScope(scope: FavoritesScopeParams): Promise<string[]> {
    const account = scope.account.trim();
    if (account.length === 0) {
      return [];
    }
    try {
      const cte = this.scopedObjectsCte(scope);
      const rows = await sql<{ object_type: string }>`
        ${cte}
        SELECT object_type
        FROM distinct_objects
        GROUP BY object_type
        ORDER BY count(*) DESC, object_type ASC
      `.execute(this.db);
      return rows.rows.map((r) => r.object_type);
    } catch (error) {
      this.logger.error(
        `findTypesByScope failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }
}

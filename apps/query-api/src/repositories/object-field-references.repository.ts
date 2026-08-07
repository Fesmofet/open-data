import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';

@Injectable()
export class ObjectFieldReferencesRepository {
  private readonly logger = new Logger(ObjectFieldReferencesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  /**
   * Active objects of `referenceObjectType` that reference `sourceObjectId`
   * via any of `updateTypes`. One row per meta_group_id (highest weight wins),
   * globally ordered by weight DESC for pagination.
   */
  async findReferencingObjectIds(params: {
    sourceObjectId: string;
    referenceObjectType: string;
    updateTypes: readonly string[];
    skip: number;
    limit: number;
  }): Promise<string[]> {
    const take = params.limit + 1;
    if (params.updateTypes.length === 0) {
      return [];
    }

    try {
      const rows = await sql<{ object_id: string }>`
        WITH matched AS (
          SELECT DISTINCT ou.object_id
          FROM object_updates ou
          WHERE ou.value_text = ${params.sourceObjectId}
            AND ou.update_type IN (${sql.join(
              params.updateTypes.map((type) => sql`${type}`),
              sql`, `,
            )})
        ),
        picked AS (
          SELECT DISTINCT ON (COALESCE(oc.meta_group_id, oc.object_id))
            oc.object_id AS object_id,
            oc.weight AS weight
          FROM objects_core oc
          INNER JOIN matched m ON m.object_id = oc.object_id
          WHERE oc.status = 'active'
            AND oc.object_type = ${params.referenceObjectType}
          ORDER BY COALESCE(oc.meta_group_id, oc.object_id),
                   oc.weight DESC NULLS LAST,
                   oc.object_id ASC
        )
        SELECT picked.object_id AS object_id
        FROM picked
        ORDER BY picked.weight DESC NULLS LAST, picked.object_id ASC
        OFFSET ${params.skip}
        LIMIT ${take}
      `.execute(this.db);

      return rows.rows.map((row) => row.object_id);
    } catch (error) {
      this.logger.error((error as Error).message);
      return [];
    }
  }
}

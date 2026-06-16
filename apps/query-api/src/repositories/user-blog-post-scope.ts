import { sql, type RawBuilder } from 'kysely';

/** Root post predicate for `posts` (no alias). */
export const ROOT_POST_PREDICATE_POSTS = sql<boolean>`(
  posts.depth = 0
  OR posts.depth IS NULL
  OR (
    TRIM(COALESCE(posts.parent_author, '')) = ''
    AND TRIM(COALESCE(posts.parent_permlink, '')) = ''
  )
)`;

/** Root post predicate for `posts` aliased as `p`. */
export const ROOT_POST_PREDICATE_P = sql<boolean>`(
  p.depth = 0
  OR p.depth IS NULL
  OR (
    TRIM(COALESCE(p.parent_author, '')) = ''
    AND TRIM(COALESCE(p.parent_permlink, '')) = ''
  )
)`;

export interface UserBlogObjectFacetRow {
  object_id: string;
  post_count: number;
}

/**
 * SQL subquery: (author, permlink) pairs that contain every id in `objectIds`.
 * Empty `objectIds` is invalid — callers must skip this filter.
 */
export function postKeysMatchingAllObjectIds(objectIds: readonly string[]): RawBuilder<unknown> {
  const idList = sql.join(
    objectIds.map((id) => sql`${id}`),
    sql`, `,
  );
  return sql`(
    SELECT po.author, po.permlink
    FROM post_objects po
    WHERE po.object_id IN (${idList})
    GROUP BY po.author, po.permlink
    HAVING COUNT(DISTINCT po.object_id) = ${objectIds.length}
  )`;
}

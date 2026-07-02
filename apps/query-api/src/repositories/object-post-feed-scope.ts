import { sql, type RawBuilder } from 'kysely';
import type {
  ObjectNewsFeedFilter,
  ObjectPostFeedScope,
  PostAuthorPermlinkRef,
} from './object-post-feed-scope.types';
import { ROOT_POST_PREDICATE_P } from './user-blog-post-scope';

function sqlStringList(values: readonly string[]): RawBuilder<unknown> {
  if (values.length === 0) {
    return sql`ARRAY[]::text[]`;
  }
  return sql`ARRAY[${sql.join(values.map((v) => sql`${v}`), sql`, `)}]::text[]`;
}

function postRefsNotInExcluded(refs: readonly PostAuthorPermlinkRef[]): RawBuilder<boolean> {
  if (refs.length === 0) {
    return sql`TRUE`;
  }
  const tuples = refs.map((r) => sql`(${r.author}, ${r.permlink})`);
  return sql`(p.author, p.permlink) NOT IN (${sql.join(tuples, sql`, `)})`;
}

function authorNotMuted(mutedAuthors: readonly string[]): RawBuilder<boolean> {
  if (mutedAuthors.length === 0) {
    return sql`TRUE`;
  }
  return sql`p.author NOT IN (${sql.join(mutedAuthors.map((a) => sql`${a}`), sql`, `)})`;
}

function postMatchesLanguages(languages: readonly string[]): RawBuilder<boolean> {
  if (languages.length === 0) {
    return sql`TRUE`;
  }
  return sql`EXISTS (
    SELECT 1 FROM post_languages pl
    WHERE pl.author = p.author AND pl.permlink = p.permlink
      AND pl.language IN (${sql.join(languages.map((l) => sql`${l}`), sql`, `)})
  )`;
}

function postLinkedToAnyObject(objectIds: readonly string[]): RawBuilder<boolean> {
  if (objectIds.length === 0) {
    return sql`FALSE`;
  }
  return sql`EXISTS (
    SELECT 1 FROM post_objects po
    WHERE po.author = p.author AND po.permlink = p.permlink
      AND po.object_id IN (${sql.join(objectIds.map((id) => sql`${id}`), sql`, `)})
  )`;
}

function postLinkedToAllObjects(ruleObjectIds: readonly string[]): RawBuilder<boolean> {
  if (ruleObjectIds.length === 0) {
    return sql`FALSE`;
  }
  return sql`EXISTS (
    SELECT 1 FROM post_objects po
    WHERE po.author = p.author AND po.permlink = p.permlink
      AND po.object_id IN (${sql.join(ruleObjectIds.map((id) => sql`${id}`), sql`, `)})
    GROUP BY po.author, po.permlink
    HAVING COUNT(DISTINCT po.object_id) = ${ruleObjectIds.length}
  )`;
}

function postHasObjectType(objectTypes: readonly string[]): RawBuilder<boolean> {
  if (objectTypes.length === 0) {
    return sql`FALSE`;
  }
  return sql`EXISTS (
    SELECT 1 FROM post_objects po
    WHERE po.author = p.author AND po.permlink = p.permlink
      AND po.object_type IN (${sql.join(objectTypes.map((t) => sql`${t}`), sql`, `)})
  )`;
}

function postNotLinkedToIgnoredObjects(ignoreList: readonly string[]): RawBuilder<boolean> {
  if (ignoreList.length === 0) {
    return sql`TRUE`;
  }
  return sql`NOT EXISTS (
    SELECT 1 FROM post_objects po
    WHERE po.author = p.author AND po.permlink = p.permlink
      AND po.object_id IN (${sql.join(ignoreList.map((id) => sql`${id}`), sql`, `)})
  )`;
}

/** Escape SQL LIKE metacharacters in a URL prefix (legacy regex escape parity). */
export function escapeLikePrefix(prefix: string): string {
  return prefix.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function postLinkMatchesPrefix(prefixes: readonly string[]): RawBuilder<boolean> {
  const trimmed = prefixes.map((p) => p.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return sql`FALSE`;
  }
  const clauses = trimmed.map(
    (prefix) => sql`pl.url LIKE ${`${escapeLikePrefix(prefix)}%`} ESCAPE '\\'`,
  );
  return sql`EXISTS (
    SELECT 1 FROM post_links pl
    WHERE pl.author = p.author AND pl.permlink = p.permlink
      AND (${sql.join(clauses, sql` OR `)})
  )`;
}

function postMentionsAccount(accounts: readonly string[]): RawBuilder<boolean> {
  const trimmed = accounts.map((a) => a.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return sql`FALSE`;
  }
  return sql`EXISTS (
    SELECT 1 FROM post_mentions pm
    WHERE pm.author = p.author AND pm.permlink = p.permlink
      AND pm.account IN (${sql.join(trimmed.map((a) => sql`${a}`), sql`, `)})
  )`;
}

export function buildNewsFeedMatchClause(
  filter: ObjectNewsFeedFilter,
  linkedObjectIds: readonly string[],
): RawBuilder<boolean> {
  const allowList = filter.allowList.filter((rule) => rule.length > 0);
  const orParts: RawBuilder<boolean>[] = [];

  for (const rule of allowList) {
    orParts.push(postLinkedToAllObjects(rule));
  }

  if (filter.typeList.length > 0) {
    orParts.push(postHasObjectType(filter.typeList));
  }

  if (
    filter.allowList.some((rule) => rule.length === 0) &&
    filter.typeList.length === 0 &&
    filter.authors.length === 0
  ) {
    orParts.push(postLinkedToAnyObject(linkedObjectIds));
  }

  if (orParts.length === 0) {
    return sql`FALSE`;
  }

  return sql`(${sql.join(orParts, sql` OR `)})`;
}

function buildRegularMatchClause(scope: ObjectPostFeedScope): RawBuilder<boolean> {
  const parts: RawBuilder<boolean>[] = [postLinkedToAnyObject(scope.linkedObjectIds)];

  if (scope.linkUrlPrefixes.length > 0) {
    parts.push(postLinkMatchesPrefix(scope.linkUrlPrefixes));
  }
  if (scope.mentionAccounts.length > 0) {
    parts.push(postMentionsAccount(scope.mentionAccounts));
  }

  return sql`(${sql.join(parts, sql` OR `)})`;
}

function buildRootPostPredicate(scope: ObjectPostFeedScope): RawBuilder<boolean> {
  if (scope.newsFeedMode && scope.newsFeedAuthorsOnly) {
    return sql`TRUE`;
  }
  return ROOT_POST_PREDICATE_P;
}

/**
 * SQL WHERE fragment for object post feed (alias `p` = posts).
 */
export function buildObjectPostFeedWhereClause(scope: ObjectPostFeedScope): RawBuilder<boolean> {
  const matchClause = scope.newsFeedMode && scope.newsFilter
    ? buildNewsFeedMatchClause(scope.newsFilter, scope.linkedObjectIds)
    : buildRegularMatchClause(scope);

  const clauses: RawBuilder<boolean>[] = [
    buildRootPostPredicate(scope),
    matchClause,
    postRefsNotInExcluded(scope.excludedPostRefs),
    authorNotMuted(scope.mutedAuthors),
    postMatchesLanguages(scope.languages),
  ];

  if (scope.newsFeedMode && scope.newsFilter) {
    clauses.push(postNotLinkedToIgnoredObjects(scope.newsFilter.ignoreList));
    if (scope.newsFilter.authors.length > 0) {
      clauses.push(
        sql`p.author IN (${sql.join(
          scope.newsFilter.authors.map((a) => sql`${a}`),
          sql`, `,
        )})`,
      );
    }
  }

  return sql`(${sql.join(clauses, sql` AND `)})`;
}

export { sqlStringList };

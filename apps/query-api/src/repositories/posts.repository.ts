import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import { Post, PostObject } from '@opden-data-layer/odl-db-types';

import {
  postKeysMatchingAllObjectIds,
  ROOT_POST_PREDICATE_P,
  ROOT_POST_PREDICATE_POSTS,
  type UserBlogObjectFacetRow,
} from './user-blog-post-scope';
import { buildObjectPostFeedWhereClause } from './object-post-feed-scope';
import type { ObjectPostFeedScope } from './object-post-feed-scope.types';

export interface FeedBranchRow {
  author: string;
  permlink: string;
  feed_at: number;
  reblogged_by: string | null;
}

export interface PostVoteSummary {
  totalCount: number;
  previewVoters: string[];
  /** True when the optional viewer account has an active vote on this post. */
  voted: boolean;
}

export type VoteDirection = 'up' | 'down';

export interface PostVoterCounts {
  upvoteCount: number;
  downvoteCount: number;
  totalHiveRsharesSum: number;
  totalWaivRsharesSum: number;
}

export interface PostVoterDbRow {
  voter: string;
  percent: number | null;
  weight: number | null;
  rshares: bigint | null;
  rshares_waiv: number | null;
}

const PREVIEW_VOTER_LIMIT = 3;

@Injectable()
export class PostsRepository {
  private readonly logger = new Logger(PostsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  /**
   * Own root posts + reblogs for account, merged newest-first with dedup by (author, permlink).
   */
  async findUserBlogFeed(
    account: string,
    cursor: { feedAt: number; author: string; permlink: string } | null,
    limitPlusOne: number,
    objectIds: readonly string[] = [],
  ): Promise<FeedBranchRow[]> {
    const own = await this.loadOwnPostsBranch(account, cursor, limitPlusOne, objectIds);
    const reblogs = await this.loadReblogsBranch(account, cursor, limitPlusOne, objectIds);
    return mergeFeedBranches(own, reblogs, limitPlusOne);
  }

  /**
   * Object facets for profile blog feed: distinct post count per object on scoped posts.
   * When `activeObjectIds` is non-empty, scopes to posts containing all active ids (AND).
   */
  async findUserBlogObjectFacets(
    account: string,
    activeObjectIds: readonly string[] = [],
  ): Promise<UserBlogObjectFacetRow[]> {
    const uniqueActive = [...new Set(activeObjectIds.map((id) => id.trim()).filter(Boolean))];
    const activeCount = uniqueActive.length;

    try {
      const activeIdList =
        activeCount > 0
          ? sql.join(
              uniqueActive.map((id) => sql`${id}`),
              sql`, `,
            )
          : null;

      const scopedPostsFilter =
        activeCount > 0 && activeIdList
          ? sql`(ubp.author, ubp.permlink) IN (
              SELECT po.author, po.permlink
              FROM post_objects po
              INNER JOIN user_blog_posts ubp2
                ON po.author = ubp2.author AND po.permlink = ubp2.permlink
              WHERE po.object_id IN (${activeIdList})
              GROUP BY po.author, po.permlink
              HAVING COUNT(DISTINCT po.object_id) = ${activeCount}
            )`
          : sql`TRUE`;

      const result = await sql<{ object_id: string; post_count: number | string }>`
        WITH user_blog_posts AS (
          SELECT p.author, p.permlink
          FROM posts p
          WHERE p.author = ${account}
            AND ${ROOT_POST_PREDICATE_P}
          UNION
          SELECT p.author, p.permlink
          FROM post_reblogged_users r
          INNER JOIN posts p ON r.author = p.author AND r.permlink = p.permlink
          WHERE r.account = ${account}
            AND ${ROOT_POST_PREDICATE_P}
        ),
        scoped_posts AS (
          SELECT ubp.author, ubp.permlink
          FROM user_blog_posts ubp
          WHERE ${scopedPostsFilter}
        )
        SELECT
          po.object_id AS object_id,
          COUNT(*)::int AS post_count
        FROM post_objects po
        INNER JOIN scoped_posts sp
          ON po.author = sp.author AND po.permlink = sp.permlink
        GROUP BY po.object_id
        ORDER BY post_count DESC, po.object_id ASC
      `.execute(this.db);

      return result.rows.map((r) => ({
        object_id: r.object_id,
        post_count:
          typeof r.post_count === 'number' ? r.post_count : Math.trunc(Number(r.post_count)),
      }));
    } catch (error) {
      this.logger.error(
        `findUserBlogObjectFacets failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Posts that @mention `profileAccount` (indexed in post_mentions), newest first.
   * Excludes posts authored by `profileAccount` (no self-authored rows, including self-mentions).
   * Optional `mutedAuthors`: exclude posts whose author is muted by the viewer.
   */
  async findMentionsFeed(
    profileAccount: string,
    mutedAuthors: string[],
    cursor: { feedAt: number; author: string; permlink: string } | null,
    limitPlusOne: number,
  ): Promise<FeedBranchRow[]> {
    let qb = this.db
      .selectFrom('post_mentions as m')
      .innerJoin('posts as p', (join) =>
        join.onRef('m.author', '=', 'p.author').onRef('m.permlink', '=', 'p.permlink'),
      )
      .where(sql<boolean>`LOWER(m.account) = LOWER(${profileAccount})`)
      .where(sql<boolean>`LOWER(p.author) <> LOWER(${profileAccount})`);

    if (mutedAuthors.length > 0) {
      qb = qb.where('p.author', 'not in', mutedAuthors);
    }

    if (cursor) {
      qb = qb.where(
        sql`(p.created_unix, p.author, p.permlink) < (${cursor.feedAt}, ${cursor.author}, ${cursor.permlink})` as never,
      );
    }

    const rows = await qb
      .select([
        sql<string>`p.author`.as('author'),
        sql<string>`p.permlink`.as('permlink'),
        sql<number>`p.created_unix`.as('feed_at'),
        sql<string | null>`NULL::text`.as('reblogged_by'),
      ])
      .orderBy(sql`p.created_unix`, 'desc')
      .orderBy(sql`p.author`, 'desc')
      .orderBy(sql`p.permlink`, 'desc')
      .limit(limitPlusOne)
      .execute();

    return rows.map((r) => ({
      author: r.author,
      permlink: r.permlink,
      feed_at: r.feed_at,
      reblogged_by: r.reblogged_by,
    }));
  }

  /**
   * Hub home feed: all root posts (guest) or personalized for `viewerAccount`
   * (followed authors, posts on followed objects, posts on authority objects).
   *
   * TODO: personalized mode uses OR + correlated EXISTS — consider pushdown UNION ALL
   * branches + mergeFeedBranches for scale (see docs/spec/data-model/posts.md).
   */
  async findHomeFeed(
    viewerAccount: string | undefined,
    mutedAuthors: string[],
    cursor: { feedAt: number; author: string; permlink: string } | null,
    limitPlusOne: number,
  ): Promise<FeedBranchRow[]> {
    const viewer = viewerAccount?.trim() ?? '';
    const personalized = viewer.length > 0;

    try {
      let qb = this.db
        .selectFrom('posts as p')
        .where(ROOT_POST_PREDICATE_P)
        .select([
          sql<string>`p.author`.as('author'),
          sql<string>`p.permlink`.as('permlink'),
          sql<number>`p.created_unix`.as('feed_at'),
          sql<string | null>`NULL::text`.as('reblogged_by'),
        ]);

      if (personalized) {
        if (mutedAuthors.length > 0) {
          qb = qb.where('p.author', 'not in', mutedAuthors);
        }
        qb = qb.where((eb) =>
          eb.or([
            eb(
              'p.author',
              'in',
              eb
                .selectFrom('user_subscriptions')
                .select('following')
                .where('follower', '=', viewer),
            ),
            eb.exists(
              eb
                .selectFrom('post_objects as po')
                .innerJoin('user_object_follows as uof', (join) =>
                  join
                    .onRef('po.object_id', '=', 'uof.object_id')
                    .on('uof.account', '=', viewer),
                )
                .whereRef('po.author', '=', 'p.author')
                .whereRef('po.permlink', '=', 'p.permlink'),
            ),
            eb.exists(
              eb
                .selectFrom('post_objects as po')
                .innerJoin('object_authority as oa', (join) =>
                  join
                    .onRef('po.object_id', '=', 'oa.object_id')
                    .on('oa.account', '=', viewer)
                    .on('oa.authority_type', 'in', ['administrative', 'ownership']),
                )
                .whereRef('po.author', '=', 'p.author')
                .whereRef('po.permlink', '=', 'p.permlink'),
            ),
          ]),
        );
      }

      if (cursor) {
        qb = qb.where(
          sql`(p.created_unix, p.author, p.permlink) < (${cursor.feedAt}, ${cursor.author}, ${cursor.permlink})` as never,
        );
      }

      const rows = await qb
        .orderBy(sql`p.created_unix`, 'desc')
        .orderBy(sql`p.author`, 'desc')
        .orderBy(sql`p.permlink`, 'desc')
        .limit(limitPlusOne)
        .execute();

      return rows.map((r) => ({
        author: r.author,
        permlink: r.permlink,
        feed_at: r.feed_at,
        reblogged_by: r.reblogged_by,
      }));
    } catch (error) {
      this.logger.error((error as Error).message);
      return [];
    }
  }

  private async loadOwnPostsBranch(
    account: string,
    cursor: { feedAt: number; author: string; permlink: string } | null,
    limitPlusOne: number,
    objectIds: readonly string[] = [],
  ): Promise<FeedBranchRow[]> {
    let qb = this.db
      .selectFrom('posts')
      .where('author', '=', account)
      .where(ROOT_POST_PREDICATE_POSTS)
      .select([
        'author',
        'permlink',
        sql<number>`posts.created_unix`.as('feed_at'),
        sql<string | null>`NULL::text`.as('reblogged_by'),
      ]);

    if (objectIds.length > 0) {
      qb = qb.where(
        sql`(posts.author, posts.permlink) IN ${postKeysMatchingAllObjectIds(objectIds)}` as never,
      );
    }

    if (cursor) {
      qb = qb.where(
        sql`(posts.created_unix, posts.author, posts.permlink) < (${cursor.feedAt}, ${cursor.author}, ${cursor.permlink})` as never,
      );
    }

    const rows = await qb
      .orderBy(sql`posts.created_unix`, 'desc')
      .orderBy('posts.author', 'desc')
      .orderBy('posts.permlink', 'desc')
      .limit(limitPlusOne)
      .execute();

    return rows.map((r) => ({
      author: r.author,
      permlink: r.permlink,
      feed_at: r.feed_at,
      reblogged_by: r.reblogged_by,
    }));
  }

  private async loadReblogsBranch(
    account: string,
    cursor: { feedAt: number; author: string; permlink: string } | null,
    limitPlusOne: number,
    objectIds: readonly string[] = [],
  ): Promise<FeedBranchRow[]> {
    let qb = this.db
      .selectFrom('post_reblogged_users as r')
      .innerJoin('posts as p', (join) =>
        join.onRef('r.author', '=', 'p.author').onRef('r.permlink', '=', 'p.permlink'),
      )
      .where('r.account', '=', account)
      .where(ROOT_POST_PREDICATE_P)
      .select([
        sql<string>`p.author`.as('author'),
        sql<string>`p.permlink`.as('permlink'),
        sql<number>`r.reblogged_at_unix`.as('feed_at'),
        sql<string>`r.account`.as('reblogged_by'),
      ]);

    if (objectIds.length > 0) {
      qb = qb.where(
        sql`(p.author, p.permlink) IN ${postKeysMatchingAllObjectIds(objectIds)}` as never,
      );
    }

    if (cursor) {
      qb = qb.where(
        sql`(r.reblogged_at_unix, p.author, p.permlink) < (${cursor.feedAt}, ${cursor.author}, ${cursor.permlink})` as never,
      );
    }

    const rows = await qb
      .orderBy(sql`r.reblogged_at_unix`, 'desc')
      .orderBy(sql`p.author`, 'desc')
      .orderBy(sql`p.permlink`, 'desc')
      .limit(limitPlusOne)
      .execute();

    return rows.map((r) => ({
      author: r.author,
      permlink: r.permlink,
      feed_at: r.feed_at,
      reblogged_by: r.reblogged_by,
    }));
  }

  async findPostsByKeys(keys: { author: string; permlink: string }[]): Promise<Post[]> {
    if (keys.length === 0) {
      return [];
    }
    return this.db
      .selectFrom('posts')
      .where((eb) =>
        eb.or(
          keys.map((k) =>
            eb.and([eb('author', '=', k.author), eb('permlink', '=', k.permlink)]),
          ),
        ),
      )
      .selectAll()
      .execute();
  }

  /** Linked posts for object Reviews tab (`post_objects` rows). */
  async countPostObjectsByObjectId(objectId: string): Promise<number> {
    const row = await this.db
      .selectFrom('post_objects')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('object_id', '=', objectId)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async findPostObjectsByKeys(keys: { author: string; permlink: string }[]): Promise<PostObject[]> {
    if (keys.length === 0) {
      return [];
    }
    return this.db
      .selectFrom('post_objects')
      .where((eb) =>
        eb.or(
          keys.map((k) =>
            eb.and([eb('author', '=', k.author), eb('permlink', '=', k.permlink)]),
          ),
        ),
      )
      .selectAll()
      .execute();
  }

  /**
   * Vote counts, top voters by rshares, and whether `viewerAccount` voted — one scan of `post_active_votes`.
   */
  async findActiveVoteSummaries(
    keys: { author: string; permlink: string }[],
    viewerAccount?: string,
  ): Promise<Map<string, PostVoteSummary>> {
    const result = new Map<string, PostVoteSummary>();
    if (keys.length === 0) {
      return result;
    }

    const pairKey = (a: string, p: string) => `${a}\0${p}`;

    for (const k of keys) {
      result.set(pairKey(k.author, k.permlink), {
        totalCount: 0,
        previewVoters: [],
        voted: false,
      });
    }

    const whereSql = sql.join(
      keys.map((k) => sql`(author = ${k.author} AND permlink = ${k.permlink})`),
      sql` OR `,
    );

    const viewerTrimmed = viewerAccount?.trim() ?? '';
    const viewerVotedExpr =
      viewerTrimmed.length > 0
        ? sql`BOOL_OR(LOWER(TRIM(voter)) = LOWER(${viewerTrimmed})) OVER (PARTITION BY author, permlink)`
        : sql`false`;

    const rows = await sql<{
      author: string;
      permlink: string;
      voter: string;
      cnt: string | number;
      viewer_voted: boolean;
    }>`
      SELECT author, permlink, voter, cnt, viewer_voted
      FROM (
        SELECT
          author,
          permlink,
          voter,
          COUNT(*) OVER (PARTITION BY author, permlink) AS cnt,
          ROW_NUMBER() OVER (
            PARTITION BY author, permlink
            ORDER BY COALESCE(rshares, 0) DESC NULLS LAST, voter ASC
          ) AS rn,
          ${viewerVotedExpr} AS viewer_voted
        FROM post_active_votes
        WHERE ${whereSql}
      ) t
      WHERE rn <= ${PREVIEW_VOTER_LIMIT}
    `.execute(this.db);

    const data = rows.rows;
    for (const row of data) {
      const pk = pairKey(row.author, row.permlink);
      const existing = result.get(pk);
      if (existing) {
        existing.totalCount = Number(row.cnt);
        existing.voted = Boolean(row.viewer_voted);
        existing.previewVoters.push(row.voter);
      }
    }

    return result;
  }

  async findPostVoterCounts(author: string, permlink: string): Promise<PostVoterCounts> {
    const row = await sql<{
      up_cnt: string | number;
      down_cnt: string | number;
      total_rshares: string | number;
      total_rshares_waiv: string | number;
    }>`
      SELECT
        COUNT(*) FILTER (
          WHERE COALESCE(percent, 0) > 0 OR COALESCE(rshares, 0) > 0
        ) AS up_cnt,
        COUNT(*) FILTER (WHERE COALESCE(percent, 0) < 0) AS down_cnt,
        COALESCE(SUM(COALESCE(rshares, 0)), 0) AS total_rshares,
        COALESCE(SUM(COALESCE(rshares_waiv, 0)), 0) AS total_rshares_waiv
      FROM post_active_votes
      WHERE author = ${author} AND permlink = ${permlink}
    `.execute(this.db);

    const data = row.rows[0];
    return {
      upvoteCount: Number(data?.up_cnt ?? 0),
      downvoteCount: Number(data?.down_cnt ?? 0),
      totalHiveRsharesSum: Number(data?.total_rshares ?? 0),
      totalWaivRsharesSum: Number(data?.total_rshares_waiv ?? 0),
    };
  }

  async findPostVotersByDirection(
    author: string,
    permlink: string,
    direction: VoteDirection,
  ): Promise<PostVoterDbRow[]> {
    const directionFilter =
      direction === 'up'
        ? sql`(COALESCE(percent, 0) > 0 OR COALESCE(rshares, 0) > 0)`
        : sql`COALESCE(percent, 0) < 0`;

    const rows = await sql<{
      voter: string;
      percent: number | null;
      weight: number | null;
      rshares: bigint | null;
      rshares_waiv: number | null;
    }>`
      SELECT voter, percent, weight, rshares, rshares_waiv
      FROM post_active_votes
      WHERE author = ${author}
        AND permlink = ${permlink}
        AND ${directionFilter}
    `.execute(this.db);

    return rows.rows;
  }

  /** Posts the viewer account has reblogged (`post_reblogged_users`). */
  async findViewerRebloggedKeys(
    keys: { author: string; permlink: string }[],
    viewerAccount: string,
  ): Promise<Set<string>> {
    const viewer = viewerAccount.trim();
    if (keys.length === 0 || viewer === '') {
      return new Set();
    }

    const rows = await this.db
      .selectFrom('post_reblogged_users')
      .select(['author', 'permlink'])
      .where('account', '=', viewer)
      .where((eb) =>
        eb.or(
          keys.map((k) =>
            eb.and([eb('author', '=', k.author), eb('permlink', '=', k.permlink)]),
          ),
        ),
      )
      .execute();

    const out = new Set<string>();
    for (const row of rows) {
      out.add(`${row.author}\0${row.permlink}`);
    }
    return out;
  }

  /** Object-scoped post feed (Reviews tab) — root posts matching legacy getPostsByObject scope. */
  async findObjectPostsFeed(
    scope: ObjectPostFeedScope,
    cursor: { feedAt: number; author: string; permlink: string } | null,
    limitPlusOne: number,
  ): Promise<FeedBranchRow[]> {
    if (scope.newsFeedMode && !scope.newsFilter) {
      return [];
    }

    try {
      const whereClause = buildObjectPostFeedWhereClause(scope);
      const cursorFilter = cursor
        ? sql`AND (p.created_unix, p.author, p.permlink) < (${cursor.feedAt}, ${cursor.author}, ${cursor.permlink})`
        : sql``;

      const rows = await sql<{
        author: string;
        permlink: string;
        feed_at: number;
        reblogged_by: string | null;
      }>`
        SELECT
          p.author AS author,
          p.permlink AS permlink,
          p.created_unix AS feed_at,
          NULL::text AS reblogged_by
        FROM posts p
        WHERE ${whereClause}
        ${cursorFilter}
        ORDER BY p.created_unix DESC, p.author DESC, p.permlink DESC
        LIMIT ${limitPlusOne}
      `.execute(this.db);

      return rows.rows.map((r) => ({
        author: r.author,
        permlink: r.permlink,
        feed_at: Number(r.feed_at),
        reblogged_by: r.reblogged_by,
      }));
    } catch (error) {
      this.logger.error((error as Error).message);
      return [];
    }
  }

  /** Feed rows for explicit post keys (pinned prepend). */
  async findPostsFeedRowsByKeys(
    keys: { author: string; permlink: string }[],
  ): Promise<FeedBranchRow[]> {
    if (keys.length === 0) {
      return [];
    }

    try {
      const rows = await this.db
        .selectFrom('posts as p')
        .where((eb) =>
          eb.or(
            keys.map((k) =>
              eb.and([eb('p.author', '=', k.author), eb('p.permlink', '=', k.permlink)]),
            ),
          ),
        )
        .where(ROOT_POST_PREDICATE_P)
        .select([
          sql<string>`p.author`.as('author'),
          sql<string>`p.permlink`.as('permlink'),
          sql<number>`p.created_unix`.as('feed_at'),
          sql<string | null>`NULL::text`.as('reblogged_by'),
        ])
        .execute();

      const order = new Map(keys.map((k, i) => [`${k.author}\0${k.permlink}`, i]));
      const mapped = rows.map((r) => ({
        author: r.author,
        permlink: r.permlink,
        feed_at: Number(r.feed_at),
        reblogged_by: r.reblogged_by,
      }));
      mapped.sort((a, b) => {
        const ai = order.get(`${a.author}\0${a.permlink}`) ?? 0;
        const bi = order.get(`${b.author}\0${b.permlink}`) ?? 0;
        return ai - bi;
      });
      return mapped;
    } catch (error) {
      this.logger.error((error as Error).message);
      return [];
    }
  }
}

function mergeFeedBranches(
  own: FeedBranchRow[],
  reblogs: FeedBranchRow[],
  limitPlusOne: number,
): FeedBranchRow[] {
  const combined = [...own, ...reblogs];
  combined.sort((a, b) => {
    if (b.feed_at !== a.feed_at) {
      return b.feed_at - a.feed_at;
    }
    if (b.author !== a.author) {
      return b.author.localeCompare(a.author);
    }
    return b.permlink.localeCompare(a.permlink);
  });

  const seen = new Set<string>();
  const out: FeedBranchRow[] = [];
  for (const row of combined) {
    const k = `${row.author}\0${row.permlink}`;
    if (seen.has(k)) {
      continue;
    }
    seen.add(k);
    out.push(row);
    if (out.length >= limitPlusOne) {
      break;
    }
  }
  return out;
}

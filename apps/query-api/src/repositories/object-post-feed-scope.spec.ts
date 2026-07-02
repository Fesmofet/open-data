import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type RawBuilder,
} from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/core';

import type { ObjectPostFeedScope } from './object-post-feed-scope.types';
import {
  buildNewsFeedMatchClause,
  buildObjectPostFeedWhereClause,
  escapeLikePrefix,
} from './object-post-feed-scope';

function compileSql(fragment: RawBuilder<boolean>): {
  sql: string;
  parameters: readonly unknown[];
} {
  const db = new Kysely<OdlDatabase>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (kysely) => new PostgresIntrospector(kysely),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
  return fragment.compile(db);
}

function baseScope(overrides: Partial<ObjectPostFeedScope> = {}): ObjectPostFeedScope {
  return {
    objectId: 'obj-1',
    objectType: 'business',
    newsFeedMode: false,
    newsFilter: null,
    linkedObjectIds: ['obj-1'],
    linkUrlPrefixes: [],
    mentionAccounts: [],
    languages: [],
    excludedPostRefs: [],
    pinnedPostRefs: [],
    viewerPinnedPostRefs: [],
    removePostRefs: [],
    mutedAuthors: [],
    newsFeedAuthorsOnly: false,
    ...overrides,
  };
}

describe('escapeLikePrefix', () => {
  it('escapes SQL LIKE metacharacters', () => {
    expect(escapeLikePrefix('https://a.com/path%wild_card')).toBe(
      'https://a.com/path\\%wild\\_card',
    );
  });
});

describe('buildNewsFeedMatchClause', () => {
  it('scopes empty allow rule to linked objects instead of matching all posts', () => {
    const clause = buildNewsFeedMatchClause(
      { allowList: [[]], ignoreList: [], typeList: [], authors: [] },
      ['newsfeed-obj'],
    );
    const { sql, parameters } = compileSql(clause);
    expect(sql).toContain('post_objects');
    expect(parameters).toContain('newsfeed-obj');
    expect(sql).not.toMatch(/\btrue\b/i);
  });
});

describe('buildObjectPostFeedWhereClause', () => {
  it('OR-composes linked objects with link prefixes for regular scope', () => {
    const { sql } = compileSql(
      buildObjectPostFeedWhereClause(
        baseScope({
          linkUrlPrefixes: ['https://example.com'],
        }),
      ),
    );
    expect(sql).toContain('post_objects');
    expect(sql).toContain('post_links');
    expect(sql.toLowerCase()).toContain(' or ');
  });

  it('uses row tuple exclusion for pin/remove refs', () => {
    const { sql, parameters } = compileSql(
      buildObjectPostFeedWhereClause(
        baseScope({
          excludedPostRefs: [{ author: 'alice', permlink: 'post-1' }],
        }),
      ),
    );
    expect(sql.toLowerCase()).toContain('(p.author, p.permlink) not in');
    expect(parameters).toEqual(expect.arrayContaining(['alice', 'post-1']));
    expect(sql).not.toContain('concat');
  });

  it('escapes LIKE wildcards in link prefix match', () => {
    const { sql, parameters } = compileSql(
      buildObjectPostFeedWhereClause(
        baseScope({
          linkUrlPrefixes: ['https://site.com/a%b_c'],
        }),
      ),
    );
    expect(sql.toLowerCase()).toContain("escape '\\'");
    expect(parameters).toEqual(
      expect.arrayContaining(['https://site.com/a\\%b\\_c%']),
    );
  });

  it('filters hashtag languages via post_languages', () => {
    const { sql, parameters } = compileSql(
      buildObjectPostFeedWhereClause(
        baseScope({
          objectType: 'hashtag',
          languages: ['en-US', 'en'],
        }),
      ),
    );
    expect(sql).toContain('post_languages');
    expect(parameters).toEqual(expect.arrayContaining(['en-US', 'en']));
  });
});

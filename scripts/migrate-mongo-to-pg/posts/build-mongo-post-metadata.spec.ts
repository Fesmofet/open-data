import {
  buildMongoPostMetadataRecord,
  objectTypeByIdFromLegacyWobjects,
  parseMongoPostJsonMetadata,
} from './build-mongo-post-metadata';
import { bindPostObjectsToPost, parsePostObjectsForInsert } from '../../../libs/core/src/post-objects';
import {
  buildRelatedImageRows,
  isObjectTypeEligibleForRelatedAlbum,
} from '../../../libs/core/src/post-related-images';
import type { MongoPost } from './types';

const grampoMetadata = {
  community: 'waivio',
  app: 'waivio/1.0.0',
  format: 'markdown',
  tags: ['web3', 'waivio', 'giveaway', 'socialsites', 'networkeffect', 'hive', 'socialblockchain'],
  links: [
    'https://www.waivio.com/@grampo',
    'https://coffeeshop.gifts/object/car3n-community/newsfeed',
    'https://www.waivio.com/object/web3',
    'https://www.waivio.com/object/hive',
  ],
  image: ['https://waivio.nyc3.digitaloceanspaces.com/example.jpg'],
  wobj: {
    wobjects: [
      { object_type: 'hashtag', name: 'web3', author_permlink: 'web3', percent: 16 },
      { object_type: 'hashtag', name: 'hive', author_permlink: 'hive', percent: 14 },
    ],
  },
  linkedObjects: [
    { object_type: 'hashtag', name: 'web3', author_permlink: 'web3', percent: 16 },
    { object_type: 'hashtag', name: 'hive', author_permlink: 'hive', percent: 14 },
    { object_type: 'hashtag', name: 'waivio', author_permlink: 'waivio', percent: 14 },
  ],
};

describe('buildMongoPostMetadataRecord', () => {
  it('maps legacy linkedObjects and json_metadata links when Mongo wobjects are absent', () => {
    const doc: MongoPost = {
      author: 'grampo',
      permlink: 'why-publish-content-on-the-blockchain-embracing-the-free-flow-of-information',
      json_metadata: JSON.stringify(grampoMetadata),
    };

    const meta = buildMongoPostMetadataRecord(doc);
    expect(meta).not.toBeNull();
    expect(meta?.objects).toEqual([
      { object_id: 'web3', percent: 16 },
      { object_id: 'hive', percent: 14 },
      { object_id: 'waivio', percent: 14 },
    ]);
    expect(meta?.tags).toEqual(grampoMetadata.tags);
    expect(meta?.links).toEqual([
      'https://coffeeshop.gifts/object/car3n-community/newsfeed',
      'https://www.waivio.com/object/web3',
      'https://www.waivio.com/object/hive',
    ]);

    const rows = bindPostObjectsToPost(
      parsePostObjectsForInsert(meta, ''),
      doc.author!,
      doc.permlink!,
    );
    expect(rows.find((r) => r.object_id === 'web3')?.percent).toBe(16);
    expect(rows.find((r) => r.object_id === 'car3n-community')?.percent).toBe(0);
  });

  it('falls back to wobj.wobjects when linkedObjects is absent', () => {
    const { linkedObjects: _removed, ...withoutLinked } = grampoMetadata;
    const doc: MongoPost = {
      json_metadata: JSON.stringify(withoutLinked),
    };

    const meta = buildMongoPostMetadataRecord(doc);
    expect(meta?.objects).toEqual([
      { object_id: 'web3', percent: 16 },
      { object_id: 'hive', percent: 14 },
    ]);
  });

  it('reads object_type from json_metadata linkedObjects', () => {
    const doc: MongoPost = {
      json_metadata: JSON.stringify(grampoMetadata),
    };
    const types = objectTypeByIdFromLegacyWobjects(doc);
    expect(types.get('web3')).toBe('hashtag');
    expect(types.get('waivio')).toBe('hashtag');
  });

  it('parses json_metadata when export stores an object instead of a string', () => {
    const doc: MongoPost = {
      json_metadata: grampoMetadata,
    };
    expect(parseMongoPostJsonMetadata(doc.json_metadata)?.links).toEqual(grampoMetadata.links);
    const meta = buildMongoPostMetadataRecord(doc);
    const rows = bindPostObjectsToPost(parsePostObjectsForInsert(meta, ''), 'a', 'p');
    expect(rows.find((r) => r.object_id === 'car3n-community')).toBeDefined();
  });

  it('keeps Mongo wobjects without percent (body-linked objects like car3n-community)', () => {
    const doc: MongoPost = {
      json_metadata: grampoMetadata,
      wobjects: [
        { author_permlink: 'web3', percent: 16, object_type: 'hashtag' },
        { author_permlink: 'car3n-community', object_type: 'newsfeed' },
      ],
    };

    const meta = buildMongoPostMetadataRecord(doc);
    expect(meta?.objects).toEqual(
      expect.arrayContaining([
        { object_id: 'web3', percent: 16 },
        { object_id: 'car3n-community', percent: 0 },
      ]),
    );

    const types = objectTypeByIdFromLegacyWobjects(doc);
    expect(types.get('car3n-community')).toBe('newsfeed');
    expect(isObjectTypeEligibleForRelatedAlbum('newsfeed')).toBe(true);

    const rows = buildRelatedImageRows(
      [{ object_id: 'car3n-community', object_type: 'newsfeed' }],
      'grampo',
      'why-publish-content-on-the-blockchain-embracing-the-free-flow-of-information',
      grampoMetadata.image,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.object_id).toBe('car3n-community');
  });
});

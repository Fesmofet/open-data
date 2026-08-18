import { HivePostBuildService } from './hive-post-build.service';

describe('HivePostBuildService', () => {
  const service = new HivePostBuildService();

  it('returns comment + comment_options without beneficiary extension when beneficiaries omitted', () => {
    const result = service.buildPost({
      author: 'alice',
      title: 'My Recipe Guide',
      body: 'Step one…',
      tags: ['food', 'recipe'],
      objects: [{ object_id: 'recipe-demo', percent: 100 }],
    });

    expect(result.opsCount).toBe(2);
    expect(result.ops).toHaveLength(2);
    expect(result.ops[0]?.type).toBe('comment');
    expect(result.ops[1]?.type).toBe('comment_options');
    const options = result.ops[1];
    if (options?.type !== 'comment_options') {
      throw new Error('expected comment_options');
    }
    expect(options.extensions).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.json_metadata.tags).toEqual(['food', 'recipe']);
    expect(result.json_metadata.objects).toEqual([
      { object_id: 'recipe-demo', percent: 100 },
    ]);
  });

  it('warns when no WAIV-eligible tag is present', () => {
    const result = service.buildPost({
      author: 'alice',
      title: 'Photo dump',
      body: 'Hello',
      tags: ['photo'],
    });

    expect(result.warnings.some((w) => w.includes('WAIV-eligible'))).toBe(true);
  });

  it('adds beneficiary extension only when beneficiaries are provided', () => {
    const result = service.buildPost({
      author: 'alice',
      title: 'With beneficiary',
      body: 'Body',
      tags: ['waivio'],
      beneficiaries: [{ account: 'bob', weight: 500 }],
    });

    const options = result.ops[1];
    if (options?.type !== 'comment_options') {
      throw new Error('expected comment_options');
    }
    expect(options.extensions).toHaveLength(1);
  });

  it('rejects author as beneficiary', () => {
    expect(() =>
      service.buildPost({
        author: 'alice',
        title: 'Bad',
        body: 'Body',
        tags: ['waivio'],
        beneficiaries: [{ account: 'alice', weight: 500 }],
      }),
    ).toThrow(/author cannot be a beneficiary/);
  });

  it('rejects object percent sum over 100', () => {
    expect(() =>
      service.buildPost({
        author: 'alice',
        title: 'Bad objects',
        body: 'Body',
        tags: ['food'],
        objects: [
          { object_id: 'a', percent: 60 },
          { object_id: 'b', percent: 50 },
        ],
      }),
    ).toThrow(/sum of object percents/);
  });

  it('generates permlink from title when omitted', () => {
    const result = service.buildPost({
      author: 'alice',
      title: 'Hello World',
      body: 'Body',
      tags: ['food'],
    });

    const comment = result.ops[0];
    if (comment?.type !== 'comment') {
      throw new Error('expected comment');
    }
    expect(comment.permlink).toBe('hello-world');
  });
});

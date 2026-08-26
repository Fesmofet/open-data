import { objectPagePath } from '@/shared/routes/object-page-path';

import { appendObjectAnchorToThreadBody } from './append-object-anchor-to-thread-body';

describe('appendObjectAnchorToThreadBody', () => {
  it('appends #object_id when id is hashtag-safe', () => {
    expect(appendObjectAnchorToThreadBody('Hello thread', 'waivio')).toBe(
      'Hello thread\n\n#waivio',
    );
  });

  it('returns body only when #object_id already present', () => {
    const body = 'Playing around #hivedev';
    expect(appendObjectAnchorToThreadBody(body, 'hivedev')).toBe(body);
  });

  it('returns body only when /object/ path already present', () => {
    const body = `See ${objectPagePath('waivio')} for details`;
    expect(appendObjectAnchorToThreadBody(body, 'waivio')).toBe(body);
  });

  it('returns #object_id alone for empty body', () => {
    expect(appendObjectAnchorToThreadBody('  ', 'fire-rock')).toBe('#fire-rock');
  });

  it('falls back to /object/ path when object id contains a dot', () => {
    expect(appendObjectAnchorToThreadBody('Hello', 'my_object.name')).toBe(
      `Hello\n\n${objectPagePath('my_object.name')}`,
    );
  });
});

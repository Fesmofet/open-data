import { objectPagePath } from '@/shared/routes/object-page-path';

import { appendObjectAnchorToThreadBody } from './append-object-anchor-to-thread-body';

describe('appendObjectAnchorToThreadBody', () => {
  it('appends object path when missing', () => {
    expect(appendObjectAnchorToThreadBody('Hello thread', 'waivio')).toBe(
      `Hello thread\n\n${objectPagePath('waivio')}`,
    );
  });

  it('returns body only when object path already present', () => {
    const body = `See ${objectPagePath('waivio')} for details`;
    expect(appendObjectAnchorToThreadBody(body, 'waivio')).toBe(body);
  });

  it('returns path alone for empty body', () => {
    expect(appendObjectAnchorToThreadBody('  ', 'fire-rock')).toBe(
      objectPagePath('fire-rock'),
    );
  });
});

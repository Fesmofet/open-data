import { postKeysMatchingAllObjectIds } from './user-blog-post-scope';

describe('user-blog-post-scope', () => {
  it('postKeysMatchingAllObjectIds returns a SQL fragment', () => {
    expect(postKeysMatchingAllObjectIds(['obj-a', 'obj-b'])).toBeDefined();
  });
});

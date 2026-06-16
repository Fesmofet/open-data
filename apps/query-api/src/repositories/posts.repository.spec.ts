import { PostsRepository } from './posts.repository';

describe('PostsRepository.findUserBlogObjectFacets', () => {
  it('returns empty array on SQL failure', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('db down'));
    const db = {
      execute,
      getExecutor: () => ({ execute }),
    } as never;
    const repo = new PostsRepository(db);

    const rows = await repo.findUserBlogObjectFacets('alice', ['obj-1']);

    expect(rows).toEqual([]);
  });
});

import { PostRelatedImagesSyncService } from './post-related-images-sync.service';

describe('PostRelatedImagesSyncService', () => {
  const repo = {
    deleteForPost: jest.fn(),
    replaceForPost: jest.fn(),
    insertRows: jest.fn(),
  };

  const svc = new PostRelatedImagesSyncService(repo as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes all related rows when post has no https images', async () => {
    await svc.syncForPost('alice', 'p', '{}', [
      {
        author: 'alice',
        permlink: 'p',
        object_id: 'a/obj',
        percent: 0,
        object_type: 'restaurant',
      },
    ]);
    expect(repo.deleteForPost).toHaveBeenCalledWith('alice', 'p', undefined);
    expect(repo.replaceForPost).not.toHaveBeenCalled();
  });

  it('replaces rows for eligible objects when images exist', async () => {
    const meta = JSON.stringify({ image: ['https://img/1.jpg'] });
    await svc.syncForPost('alice', 'p', meta, [
      {
        author: 'alice',
        permlink: 'p',
        object_id: 'a/obj',
        percent: 0,
        object_type: 'restaurant',
      },
    ]);
    expect(repo.replaceForPost).toHaveBeenCalledWith('alice', 'p', [
      {
        object_id: 'a/obj',
        author: 'alice',
        permlink: 'p',
        image_url: 'https://img/1.jpg',
        sort_ord: 0,
      },
    ], undefined);
  });

  it('appends rows for new comment bindings only', async () => {
    const meta = JSON.stringify({ image: ['https://img/1.jpg'] });
    await svc.appendForNewBindings('alice', 'p', meta, [
      {
        author: 'alice',
        permlink: 'p',
        object_id: 'a/new',
        percent: 0,
        object_type: 'dish',
      },
    ]);
    expect(repo.insertRows).toHaveBeenCalled();
    expect(repo.replaceForPost).not.toHaveBeenCalled();
  });

  it('passes transaction executor to repository', async () => {
    const trx = { trx: true };
    const meta = JSON.stringify({ image: ['https://img/1.jpg'] });
    await svc.syncForPost(
      'alice',
      'p',
      meta,
      [
        {
          author: 'alice',
          permlink: 'p',
          object_id: 'a/obj',
          percent: 0,
          object_type: 'restaurant',
        },
      ],
      trx as never,
    );
    expect(repo.replaceForPost).toHaveBeenCalledWith(
      'alice',
      'p',
      expect.any(Array),
      trx,
    );
  });
});

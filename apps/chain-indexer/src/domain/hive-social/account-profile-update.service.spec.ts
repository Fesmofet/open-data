import { AccountProfileUpdateService } from './account-profile-update.service';

describe('AccountProfileUpdateService', () => {
  const accounts = {
    findByName: jest.fn(),
    update: jest.fn(),
  };
  const accountSyncQueue = {
    enqueue: jest.fn(),
  };

  const notificationEmitter = {
    emitWithContext: jest.fn(),
    hiveContext: jest.fn(),
  };

  let service: AccountProfileUpdateService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountProfileUpdateService(
      accounts as never,
      accountSyncQueue as never,
      notificationEmitter as never,
    );
  });

  it('updates posting_json_metadata and alias when row exists', async () => {
    accounts.findByName.mockResolvedValue({ name: 'grampo' });
    accounts.update.mockResolvedValue(undefined);

    const pjm = JSON.stringify({
      profile: {
        name: 'Grampo',
        about: 'Founder of Waivio',
        profile_image: 'https://example.com/a.jpg',
      },
    });

    await service.handleAccountUpdate({
      account: 'grampo',
      posting_json_metadata: pjm,
    });

    expect(accounts.update).toHaveBeenCalledWith('grampo', {
      posting_json_metadata: pjm,
      alias: 'Grampo',
      profile_image: 'https://example.com/a.jpg',
    });
    expect(accountSyncQueue.enqueue).not.toHaveBeenCalled();
  });

  it('updates both metadata strings when account_update carries jm and pjm', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    accounts.update.mockResolvedValue(undefined);

    const jm = JSON.stringify({ profile: { about: 'owner meta' } });
    const pjm = JSON.stringify({ profile: { name: 'Alice', about: 'posting meta' } });

    await service.handleAccountUpdate({
      account: 'alice',
      json_metadata: jm,
      posting_json_metadata: pjm,
    });

    expect(accounts.update).toHaveBeenCalledWith('alice', {
      posting_json_metadata: pjm,
      json_metadata: jm,
      alias: 'Alice',
      profile_image: null,
    });
  });

  it('enqueues account sync when row is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    accounts.update.mockResolvedValue(undefined);

    await service.handleAccountUpdate({
      account: 'bob',
      posting_json_metadata: JSON.stringify({ profile: { name: 'Bob' } }),
    });

    expect(accounts.update).not.toHaveBeenCalled();
    expect(accountSyncQueue.enqueue).toHaveBeenCalledWith(
      'bob',
      expect.any(Number),
    );
  });
});

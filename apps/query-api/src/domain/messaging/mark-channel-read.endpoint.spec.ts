import { MarkChannelReadEndpoint } from './mark-channel-read.endpoint';
import { MessagingRepository } from '../../repositories/messaging.repository';

describe('MarkChannelReadEndpoint', () => {
  const messagingRepo = {
    findChannelById: jest.fn(),
    isMember: jest.fn(),
    setLastReadAt: jest.fn(),
    getMemberLastReadAt: jest.fn(),
  };

  const endpoint = new MarkChannelReadEndpoint(
    messagingRepo as unknown as MessagingRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects mark-read for non-member', async () => {
    messagingRepo.findChannelById.mockResolvedValue({ channel_id: 'dm-1' });
    messagingRepo.isMember.mockResolvedValue(false);

    await expect(endpoint.execute('dm-1', 'bob', 200)).rejects.toMatchObject({
      message: 'Not a channel member',
    });
    expect(messagingRepo.setLastReadAt).not.toHaveBeenCalled();
  });

  it('updates last_read_at_unix for member', async () => {
    messagingRepo.findChannelById.mockResolvedValue({ channel_id: 'dm-1' });
    messagingRepo.isMember.mockResolvedValue(true);
    messagingRepo.setLastReadAt.mockResolvedValue(true);
    messagingRepo.getMemberLastReadAt.mockResolvedValue(200);

    const result = await endpoint.execute('dm-1', 'alice', 200);

    expect(messagingRepo.setLastReadAt).toHaveBeenCalledWith('dm-1', 'alice', 200);
    expect(result).toEqual({ updated: true, last_read_at_unix: 200 });
  });
});

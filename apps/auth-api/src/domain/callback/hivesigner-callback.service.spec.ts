import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { HivesignerCallbackService } from './hivesigner-callback.service';
import type { ChallengesRepository } from '../../repositories/challenges.repository';
import type { HivesignerApiService } from '../providers/hivesigner-api.service';
import type { IssueSessionService } from '../session/issue-session.service';

describe('HivesignerCallbackService', () => {
  let challenges: jest.Mocked<
    Pick<ChallengesRepository, 'findActiveHivesignerByState' | 'markUsed'>
  >;
  let hivesignerApi: jest.Mocked<Pick<HivesignerApiService, 'fetchAccount'>>;
  let sessions: jest.Mocked<Pick<IssueSessionService, 'issueForUser'>>;
  let service: HivesignerCallbackService;

  beforeEach(() => {
    challenges = {
      findActiveHivesignerByState: jest.fn(),
      markUsed: jest.fn(),
    };
    hivesignerApi = {
      fetchAccount: jest.fn(),
    };
    sessions = {
      issueForUser: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { username: 'alice' },
      }),
    };
    service = new HivesignerCallbackService(
      challenges as unknown as ChallengesRepository,
      hivesignerApi as unknown as HivesignerApiService,
      sessions as unknown as IssueSessionService,
    );
  });

  it('requires state', async () => {
    await expect(
      service.execute({
        accessToken: 'token',
        username: 'alice',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid HiveSigner token', async () => {
    challenges.findActiveHivesignerByState.mockResolvedValue({
      id: 'challenge-1',
      hive_username: 'alice',
      expires_at: new Date(Date.now() + 60_000),
      used_at: null,
    } as never);
    hivesignerApi.fetchAccount.mockRejectedValue(
      new UnauthorizedException('Invalid HiveSigner access token'),
    );

    await expect(
      service.execute({
        accessToken: 'bad-token',
        username: 'alice',
        state: 'state-1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessions.issueForUser).not.toHaveBeenCalled();
  });

  it('rejects query username that disagrees with verified upstream account', async () => {
    challenges.findActiveHivesignerByState.mockResolvedValue({
      id: 'challenge-1',
      hive_username: 'alice',
      expires_at: new Date(Date.now() + 60_000),
      used_at: null,
    } as never);
    hivesignerApi.fetchAccount.mockResolvedValue({ username: 'alice' });

    await expect(
      service.execute({
        accessToken: 'good-token',
        username: 'mallory',
        state: 'state-1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessions.issueForUser).not.toHaveBeenCalled();
  });

  it('derives identity from verified upstream account', async () => {
    challenges.findActiveHivesignerByState.mockResolvedValue({
      id: 'challenge-1',
      hive_username: 'alice',
      expires_at: new Date(Date.now() + 60_000),
      used_at: null,
    } as never);
    hivesignerApi.fetchAccount.mockResolvedValue({ username: 'alice' });
    challenges.markUsed.mockResolvedValue(true);

    await service.execute({
      accessToken: 'good-token',
      username: 'alice',
      state: 'state-1',
    });

    expect(sessions.issueForUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'alice' }),
    );
  });
});

import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import { VerifyHiveAuthService } from './verify-hiveauth.service';
import type { PostingSignatureVerifierService } from './posting-signature-verifier.service';
import type { IssueSessionService } from '../session/issue-session.service';

describe('VerifyHiveAuthService', () => {
  let verifier: jest.Mocked<
    Pick<
      PostingSignatureVerifierService,
      'validateChallenge' | 'verifyPostingSignature' | 'consumeChallenge'
    >
  >;
  let sessions: jest.Mocked<Pick<IssueSessionService, 'issueForUser'>>;
  let service: VerifyHiveAuthService;

  beforeEach(() => {
    verifier = {
      validateChallenge: jest.fn(),
      verifyPostingSignature: jest.fn(),
      consumeChallenge: jest.fn(),
    };
    sessions = {
      issueForUser: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { username: 'alice' },
      }),
    };
    service = new VerifyHiveAuthService(
      verifier as unknown as PostingSignatureVerifierService,
      sessions as unknown as IssueSessionService,
    );
  });

  it('rejects forged authData without signature proof', async () => {
    await expect(
      service.execute({
        challengeId: '00000000-0000-4000-8000-000000000001',
        username: 'alice',
        authData: JSON.stringify({
          username: 'alice',
          expire: Math.floor(Date.now() / 1000) + 3600,
        }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(sessions.issueForUser).not.toHaveBeenCalled();
  });

  it('issues session only after cryptographic verification', async () => {
    verifier.validateChallenge.mockResolvedValue({
      id: 'challenge-1',
      message: 'Hive sign in; nonce=abc',
      hiveUsername: 'alice',
    });

    const authData = JSON.stringify({
      username: 'alice',
      expire: Math.floor(Date.now() / 1000) + 3600,
      challenge: 'Hive sign in; nonce=abc',
      pubkey: 'STM8TEST',
      signature: 'SIG',
    });

    await service.execute({
      challengeId: 'challenge-1',
      username: 'alice',
      authData,
    });

    expect(verifier.verifyPostingSignature).toHaveBeenCalledWith({
      username: 'alice',
      signedMessage: 'Hive sign in; nonce=abc',
      signature: 'SIG',
      publicKey: 'STM8TEST',
    });
    expect(verifier.consumeChallenge).toHaveBeenCalledWith('challenge-1');
    expect(sessions.issueForUser).toHaveBeenCalled();
  });

  it('rejects expired HiveAuth session metadata', async () => {
    const authData = JSON.stringify({
      username: 'alice',
      expire: Math.floor(Date.now() / 1000) - 10,
      challenge: 'Hive sign in; nonce=abc',
      pubkey: 'STM8TEST',
      signature: 'SIG',
    });

    await expect(
      service.execute({
        challengeId: 'challenge-1',
        username: 'alice',
        authData,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { PostingSignatureVerifierService } from './posting-signature-verifier.service';
import type { ChallengesRepository } from '../../repositories/challenges.repository';
import type { HiveNodeService } from '../providers/hive-node.service';

describe('PostingSignatureVerifierService', () => {
  let challenges: jest.Mocked<Pick<ChallengesRepository, 'findById' | 'markUsed'>>;
  let hive: jest.Mocked<
    Pick<
      HiveNodeService,
      'isPostingKeyAuthorized' | 'verifyPostingSignatureAgainstAuthority'
    >
  >;
  let service: PostingSignatureVerifierService;

  beforeEach(() => {
    challenges = {
      findById: jest.fn(),
      markUsed: jest.fn(),
    };
    hive = {
      isPostingKeyAuthorized: jest.fn(),
      verifyPostingSignatureAgainstAuthority: jest.fn(),
    };
    service = new PostingSignatureVerifierService(
      challenges as unknown as ChallengesRepository,
      hive as unknown as HiveNodeService,
    );
  });

  it('rejects forged HiveAuth payload without valid signature', async () => {
    hive.isPostingKeyAuthorized.mockResolvedValue(true);

    await expect(
      service.verifyPostingSignature({
        username: 'alice',
        signedMessage: 'Hive sign in; nonce=abc',
        signature: 'deadbeef',
        publicKey: 'STM8TEST',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects posting key below authority threshold', async () => {
    hive.isPostingKeyAuthorized.mockResolvedValue(false);

    await expect(
      service.verifyPostingSignature({
        username: 'alice',
        signedMessage: 'Hive sign in; nonce=threshold',
        signature: 'SIG',
        publicKey: 'STMLOW',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects used or expired challenges', async () => {
    challenges.findById.mockResolvedValue({
      id: 'challenge-used',
      provider: 'keychain',
      hive_username: 'alice',
      message: 'msg',
      expires_at: new Date(Date.now() + 60_000),
      used_at: new Date(),
    } as never);

    await expect(
      service.validateChallenge({
        challengeId: 'challenge-used',
        provider: 'keychain',
        username: 'alice',
        signedMessage: 'msg',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    challenges.findById.mockResolvedValue({
      id: 'challenge-expired',
      provider: 'keychain',
      hive_username: 'alice',
      message: 'msg',
      expires_at: new Date(Date.now() - 1),
      used_at: null,
    } as never);

    await expect(
      service.validateChallenge({
        challengeId: 'challenge-expired',
        provider: 'keychain',
        username: 'alice',
        signedMessage: 'msg',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects provider mismatch', async () => {
    challenges.findById.mockResolvedValue({
      id: 'challenge-1',
      provider: 'hiveauth',
      hive_username: 'alice',
      message: 'msg',
      expires_at: new Date(Date.now() + 60_000),
      used_at: null,
    } as never);

    await expect(
      service.validateChallenge({
        challengeId: 'challenge-1',
        provider: 'keychain',
        username: 'alice',
        signedMessage: 'msg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

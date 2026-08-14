import { Injectable } from '@nestjs/common';
import { IssueSessionService } from '../session/issue-session.service';
import { PostingSignatureVerifierService } from './posting-signature-verifier.service';

@Injectable()
export class VerifyKeychainService {
  constructor(
    private readonly verifier: PostingSignatureVerifierService,
    private readonly sessions: IssueSessionService,
  ) {}

  async execute(input: {
    challengeId: string;
    username: string;
    signature: string;
    signedMessage: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const username = input.username.trim().toLowerCase().replace(/^@/, '');
    const challenge = await this.verifier.validateChallenge({
      challengeId: input.challengeId,
      provider: 'keychain',
      username,
      signedMessage: input.signedMessage,
    });

    await this.verifier.verifyPostingSignature({
      username,
      signedMessage: input.signedMessage,
      signature: input.signature,
    });

    await this.verifier.consumeChallenge(challenge.id);

    return this.sessions.issueForUser({
      username,
      provider: 'keychain',
      ip: input.ip,
      deviceInfo: input.userAgent ?? null,
    });
  }
}

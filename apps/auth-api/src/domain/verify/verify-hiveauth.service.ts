import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { IssueSessionService } from '../session/issue-session.service';
import { PostingSignatureVerifierService } from './posting-signature-verifier.service';

/**
 * Payload the browser or agent sends after a successful HiveAuth flow with
 * a signed server challenge proof from HAS/PKSA.
 */
const hiveAuthAuthDataSchema = z.object({
  username: z.string(),
  expire: z.number(),
  challenge: z.string().min(1),
  pubkey: z.string().min(1),
  signature: z.string().min(1),
});

@Injectable()
export class VerifyHiveAuthService {
  constructor(
    private readonly verifier: PostingSignatureVerifierService,
    private readonly sessions: IssueSessionService,
  ) {}

  async execute(input: {
    challengeId: string;
    username: string;
    authData: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const username = input.username.trim().toLowerCase().replace(/^@/, '');
    let parsed: z.infer<typeof hiveAuthAuthDataSchema>;
    try {
      const raw = JSON.parse(input.authData) as unknown;
      parsed = hiveAuthAuthDataSchema.parse(raw);
    } catch {
      throw new BadRequestException('Invalid authData JSON');
    }

    if (parsed.username.trim().toLowerCase().replace(/^@/, '') !== username) {
      throw new UnauthorizedException('Username mismatch');
    }

    if (parsed.expire * 1000 < Date.now()) {
      throw new UnauthorizedException('HiveAuth session expired');
    }

    const challenge = await this.verifier.validateChallenge({
      challengeId: input.challengeId,
      provider: 'hiveauth',
      username,
      signedMessage: parsed.challenge,
    });

    await this.verifier.verifyPostingSignature({
      username,
      signedMessage: parsed.challenge,
      signature: parsed.signature,
      publicKey: parsed.pubkey,
    });

    await this.verifier.consumeChallenge(challenge.id);

    return this.sessions.issueForUser({
      username,
      provider: 'hiveauth',
      ip: input.ip,
      deviceInfo: input.userAgent ?? null,
      identityMetadata: { hiveAuth: true },
    });
  }
}

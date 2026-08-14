import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PublicKey, Signature, cryptoUtils } from '@hiveio/dhive';
import type { AuthProvider } from '../../database/types';
import { ChallengesRepository } from '../../repositories/challenges.repository';
import { HiveNodeService } from '../providers/hive-node.service';

export type ValidatedChallenge = {
  id: string;
  message: string;
  hiveUsername: string;
};

@Injectable()
export class PostingSignatureVerifierService {
  constructor(
    private readonly challenges: ChallengesRepository,
    private readonly hive: HiveNodeService,
  ) {}

  async validateChallenge(input: {
    challengeId: string;
    provider: AuthProvider;
    username: string;
    signedMessage: string;
  }): Promise<ValidatedChallenge> {
    const username = input.username.trim().toLowerCase().replace(/^@/, '');
    const challenge = await this.challenges.findById(input.challengeId);
    if (!challenge) {
      throw new UnauthorizedException('Invalid challenge');
    }
    if (challenge.provider !== input.provider) {
      throw new BadRequestException('Challenge provider mismatch');
    }
    if (challenge.used_at) {
      throw new UnauthorizedException('Challenge already used');
    }
    if (challenge.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Challenge expired');
    }
    if (challenge.hive_username !== username) {
      throw new UnauthorizedException('Username mismatch');
    }
    if (challenge.message !== input.signedMessage) {
      throw new UnauthorizedException('Signed message mismatch');
    }

    return {
      id: challenge.id,
      message: challenge.message,
      hiveUsername: username,
    };
  }

  async verifyPostingSignature(input: {
    username: string;
    signedMessage: string;
    signature: string;
    publicKey?: string;
  }): Promise<void> {
    const username = input.username.trim().toLowerCase().replace(/^@/, '');
    let signature: Signature;
    try {
      signature = Signature.fromString(input.signature);
    } catch {
      throw new UnauthorizedException('Invalid signature format');
    }

    const digest = cryptoUtils.sha256(
      Buffer.from(input.signedMessage, 'utf8'),
    );

    if (input.publicKey) {
      let publicKey: PublicKey;
      try {
        publicKey = PublicKey.fromString(input.publicKey);
      } catch {
        throw new UnauthorizedException('Invalid public key format');
      }

      const authorized = await this.hive.isPostingKeyAuthorized(
        username,
        input.publicKey,
      );
      if (!authorized) {
        throw new UnauthorizedException('Posting key not authorized for account');
      }

      if (!publicKey.verify(digest, signature)) {
        throw new UnauthorizedException('Signature verification failed');
      }
      return;
    }

    const verified = await this.hive.verifyPostingSignatureAgainstAuthority(
      username,
      digest,
      signature,
    );
    if (!verified) {
      throw new UnauthorizedException('Signature verification failed');
    }
  }

  async consumeChallenge(challengeId: string): Promise<void> {
    const marked = await this.challenges.markUsed(challengeId, new Date());
    if (!marked) {
      throw new UnauthorizedException('Challenge already used');
    }
  }
}

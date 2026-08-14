import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, PublicKey, type Signature } from '@hiveio/dhive';
import type { PostingAuthority } from './posting-authority.types';

@Injectable()
export class HiveNodeService {
  private readonly logger = new Logger(HiveNodeService.name);
  private readonly client: Client;

  constructor(private readonly config: ConfigService) {
    const nodes = this.config.get<string[]>('hive.rpcNodes') ?? [
      'https://api.hive.blog',
    ];
    this.client = new Client(nodes);
  }

  /**
   * Returns Hive posting public key (STM/... or KSM/...) for the account, or null if missing.
   * @deprecated Prefer getPostingAuthority or verifyPostingSignatureAgainstAuthority.
   */
  async getPostingPublicKey(username: string): Promise<string | null> {
    const authority = await this.getPostingAuthority(username);
    return authority?.keyAuths[0]?.[0] ?? null;
  }

  async getPostingAuthority(username: string): Promise<PostingAuthority | null> {
    try {
      const accounts = await this.client.database.getAccounts([username]);
      const acc = accounts[0];
      if (!acc?.posting?.key_auths?.length) {
        return null;
      }

      return {
        keyAuths: acc.posting.key_auths.map(([key, weight]) => [
          String(key),
          Number(weight),
        ]),
        weightThreshold: Number(acc.posting.weight_threshold),
      };
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async isPostingKeyAuthorized(
    username: string,
    publicKey: string,
  ): Promise<boolean> {
    const authority = await this.getPostingAuthority(username);
    if (!authority) {
      return false;
    }

    const entry = authority.keyAuths.find(([key]) => key === publicKey);
    if (!entry) {
      return false;
    }

    return entry[1] >= authority.weightThreshold;
  }

  async verifyPostingSignatureAgainstAuthority(
    username: string,
    digest: Buffer,
    signature: Signature,
  ): Promise<boolean> {
    const authority = await this.getPostingAuthority(username);
    if (!authority) {
      return false;
    }

    for (const [publicKey, weight] of authority.keyAuths) {
      if (weight < authority.weightThreshold) {
        continue;
      }
      try {
        if (PublicKey.fromString(publicKey).verify(digest, signature)) {
          return true;
        }
      } catch {
        // try next key
      }
    }

    return false;
  }
}

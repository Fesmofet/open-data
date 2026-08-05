'use client';

import type {
  BroadcastTransactionInput,
  BroadcastTransactionResult,
  WalletFacade,
  WalletProviderId,
} from '../domain/types';
import type { IAuthBffClient } from '../application/ports/auth-api.port';
import type { IHiveSigner } from '../application/ports/hive-signer.port';
import {
  resolveBroadcastProvider,
  shouldFallbackKeychainBroadcastToHas,
  shouldTryKeychainBeforeHas,
} from './resolve-broadcast-provider';
import { signBufferWithKeychain } from './providers/keychain-provider';
import { redirectToHiveSigner } from './providers/hivesigner-provider';
import { createHiveAuthSigner } from './signers/hiveauth-signer';
import { createKeychainSigner } from './signers/keychain-signer';
import { createHiveSignerSigner } from './signers/hivesigner-signer';

export class DefaultWalletFacade implements WalletFacade {
  private activeProvider: WalletProviderId | null = null;

  constructor(
    private readonly bff: IAuthBffClient,
    private readonly signers: ReadonlyMap<WalletProviderId, IHiveSigner>,
  ) {}

  setActiveProvider(provider: WalletProviderId | null): void {
    this.activeProvider = provider;
  }

  async login(providerId: WalletProviderId, username: string): Promise<void> {
    this.activeProvider = providerId;
    const ch = await this.bff.challenge({ provider: providerId, username });

    if (providerId === 'keychain') {
      const sig = await signBufferWithKeychain(username, ch.message);
      await this.bff.verifyKeychain({
        challengeId: ch.challengeId,
        username,
        signature: sig.signature,
        signedMessage: sig.signedMessage,
      });
      return;
    }

    if (providerId === 'hivesigner') {
      if (!ch.authorizeUrl) {
        throw new Error('HiveSigner authorizeUrl missing');
      }
      redirectToHiveSigner(ch.authorizeUrl);
      return;
    }

    throw new Error(
      'HiveAuth: use the HiveAuth login UI to complete verification and call verifyHiveAuth',
    );
  }

  async broadcast(
    input: BroadcastTransactionInput,
  ): Promise<BroadcastTransactionResult> {
    if (shouldTryKeychainBeforeHas()) {
      const keychainSigner = this.signers.get('keychain');
      if (keychainSigner) {
        try {
          return await keychainSigner.sign(input);
        } catch (error) {
          if (!shouldFallbackKeychainBroadcastToHas(error)) {
            throw error;
          }
        }
      }
    }

    const provider = resolveBroadcastProvider(this.activeProvider);
    const signer = this.signers.get(provider);
    if (!signer) {
      throw new Error('No signer for provider: ' + provider);
    }
    return signer.sign(input);
  }
}

export function createWalletFacade(bff: IAuthBffClient): WalletFacade {
  const signers = new Map<WalletProviderId, IHiveSigner>([
    ['keychain', createKeychainSigner()],
    ['hivesigner', createHiveSignerSigner()],
    ['hiveauth', createHiveAuthSigner()],
  ]);
  return new DefaultWalletFacade(bff, signers);
}

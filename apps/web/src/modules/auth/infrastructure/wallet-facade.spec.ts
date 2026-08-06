/** @jest-environment jsdom */

jest.mock('./providers/has/has-client', () => ({}));

import type { IAuthBffClient } from '../application/ports/auth-api.port';
import type { IHiveSigner } from '../application/ports/hive-signer.port';
import type { WalletProviderId } from '../domain/types';
import { DefaultWalletFacade } from './wallet-facade';

const mockInput = { operations: [] } as const;

function createMockSigner(id: WalletProviderId): IHiveSigner {
  return {
    sign: jest.fn().mockResolvedValue({ transactionId: `${id}-tx` }),
  };
}

describe('DefaultWalletFacade.broadcast', () => {
  const keychainSigner = createMockSigner('keychain');
  const hivesignerSigner = createMockSigner('hivesigner');
  const hiveauthSigner = createMockSigner('hiveauth');

  const signers = new Map<WalletProviderId, IHiveSigner>([
    ['keychain', keychainSigner],
    ['hivesigner', hivesignerSigner],
    ['hiveauth', hiveauthSigner],
  ]);

  const facade = new DefaultWalletFacade({} as IAuthBffClient, signers);

  beforeEach(() => {
    jest.clearAllMocks();
    (window as Window & { hive_keychain?: { requestSignBuffer?: unknown } }).hive_keychain =
      { requestSignBuffer: () => undefined };
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
  });

  it('uses HiveSigner signer when activeProvider is hivesigner even if Keychain is injected', async () => {
    facade.setActiveProvider('hivesigner');

    const result = await facade.broadcast(mockInput);

    expect(hivesignerSigner.sign).toHaveBeenCalledWith(mockInput);
    expect(keychainSigner.sign).not.toHaveBeenCalled();
    expect(hiveauthSigner.sign).not.toHaveBeenCalled();
    expect(result.transactionId).toBe('hivesigner-tx');
  });

  it('tries Keychain before HAS when activeProvider is keychain on desktop', async () => {
    facade.setActiveProvider('keychain');

    const result = await facade.broadcast(mockInput);

    expect(keychainSigner.sign).toHaveBeenCalledWith(mockInput);
    expect(hivesignerSigner.sign).not.toHaveBeenCalled();
    expect(result.transactionId).toBe('keychain-tx');
  });

  it('dispatches to resolved provider when Keychain is not available', async () => {
    delete (window as Window & { hive_keychain?: unknown }).hive_keychain;
    facade.setActiveProvider('keychain');

    await facade.broadcast(mockInput);

    expect(keychainSigner.sign).toHaveBeenCalledWith(mockInput);
  });
});

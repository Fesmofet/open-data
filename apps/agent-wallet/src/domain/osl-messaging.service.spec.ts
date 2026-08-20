import { ConfigService } from '@nestjs/config';
import {
  demoMemoKeyPair,
  encryptEphemeralOneWay,
} from '@opden-data-layer/hive-memo-crypto';

import { OslMessagingService } from './osl-messaging.service';
import { LocalKeysService } from './local-keys.service';

describe('OslMessagingService', () => {
  const demo = demoMemoKeyPair('osl-messaging-service-spec');

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'odlCustomJsonId') {
        return 'odl-testnet';
      }
      if (key === 'signingMode') {
        return 'local';
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  const localKeys = {
    isMemoReady: jest.fn().mockReturnValue(true),
    getMemoPrivateKey: jest.fn().mockReturnValue({ toString: () => demo.privateWif }),
    getRpcClient: jest.fn(),
  };

  const service = new OslMessagingService(config, localKeys as unknown as LocalKeysService);

  beforeEach(() => {
    jest.clearAllMocks();
    localKeys.isMemoReady.mockReturnValue(true);
  });

  it('buildMessageCreate returns message_create op', () => {
    const result = service.buildMessageCreate({
      creator: 'alice',
      peer: 'bob',
      body: 'hello',
    });
    expect(result.opsCount).toBe(1);
    expect(result.bytes).toBeGreaterThan(0);
    const op = result.ops[0] as { id: string; json: string };
    expect(op.id).toBe('odl-testnet');
    const parsed = JSON.parse(op.json) as {
      events: { action: string; payload: Record<string, string> }[];
    };
    expect(parsed.events[0]?.action).toBe('message_create');
    expect(parsed.events[0]?.payload).toEqual({ peer: 'bob', body: 'hello' });
  });

  it('rejects encrypted build when signing mode is not local', async () => {
    const getMock = config.get as jest.Mock;
    getMock.mockImplementation((key: string) => {
      if (key === 'signingMode') {
        return 'has';
      }
      if (key === 'odlCustomJsonId') {
        return 'odl-testnet';
      }
      return undefined;
    });

    await expect(
      service.buildEncryptedMessageCreate({
        creator: 'alice',
        peer: 'bob',
        recipient: 'bob',
        plaintext: 'secret',
        mode: 'memo',
      }),
    ).rejects.toThrow('AGENT_WALLET_SIGNING_MODE=local');

    getMock.mockImplementation((key: string) => {
      if (key === 'odlCustomJsonId') {
        return 'odl-testnet';
      }
      if (key === 'signingMode') {
        return 'local';
      }
      return undefined;
    });
  });

  it('memoEncrypt supports ephemeral without sender memo key', async () => {
    localKeys.isMemoReady.mockReturnValue(false);
    const ciphertext = encryptEphemeralOneWay(demo.publicMemo, 'secret');
    const result = await service.memoEncrypt({
      recipientMemoPublic: demo.publicMemo,
      plaintext: 'secret',
      mode: 'ephemeral',
    });
    expect(result.ciphertext.startsWith('#')).toBe(true);
    expect(result.ciphertext).not.toBe(ciphertext);
  });

  it('memoDecrypt round-trips memo-mode ciphertext', async () => {
    const encrypted = await service.memoEncrypt({
      recipientMemoPublic: demo.publicMemo,
      plaintext: 'hello agent',
      mode: 'memo',
    });
    expect(service.memoDecrypt({ ciphertext: encrypted.ciphertext })).toBe('hello agent');
  });

  it('buildEncryptedMessageCreate supports ephemeral without memo key', async () => {
    localKeys.isMemoReady.mockReturnValue(false);
    localKeys.getRpcClient.mockReturnValue({
      database: {
        getAccounts: jest.fn().mockResolvedValue([{ memo_key: demo.publicMemo }]),
      },
    });

    const result = await service.buildEncryptedMessageCreate({
      creator: 'alice',
      peer: 'bob',
      recipient: 'bob',
      plaintext: 'secret',
      mode: 'ephemeral',
    });

    expect(result.opsCount).toBe(1);
    const parsed = JSON.parse((result.ops[0] as { json: string }).json) as {
      events: { payload: { encrypted_body?: string; encryption?: { mode: string } } }[];
    };
    expect(parsed.events[0]?.payload.encrypted_body?.startsWith('#')).toBe(true);
    expect(parsed.events[0]?.payload.encryption?.mode).toBe('ephemeral');
  });
});

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import CryptoJS from 'crypto-js';
import { HAS_CMD, encryptHasPayload } from '@opden-data-layer/hive-auth';
import type { HasTransport, HasTransportFactory } from '@opden-data-layer/hive-auth';

import { AgentWalletAuthService } from '../auth/agent-wallet-auth.service';
import { HAS_TRANSPORT_FACTORY } from './has-transport.token';
import { HasSessionService } from './has-session.service';
import { LocalFilesService } from './local-files.service';
import { PendingRequestsStore } from './pending-requests.store';

class FakeHasTransport implements HasTransport {
  readyState = 1;
  private messageHandler: ((data: string) => void) | null = null;
  private connectedEmitted = false;
  readonly sent: string[] = [];

  send(data: string): void {
    this.sent.push(data);
    let frame: { cmd?: string; account?: string };
    try {
      frame = JSON.parse(data) as { cmd?: string; account?: string };
    } catch {
      return;
    }

    if (frame.cmd === HAS_CMD.AUTH_REQ && frame.account) {
      queueMicrotask(() => {
        this.emit({
          cmd: HAS_CMD.AUTH_WAIT,
          uuid: `auth-${this.sent.length}`,
          expire: Date.now() + 60_000,
          account: frame.account,
        });
      });
    }
  }

  close(): void {
    this.readyState = 3;
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler;
    if (!this.connectedEmitted) {
      this.connectedEmitted = true;
      handler(
        JSON.stringify({
          cmd: HAS_CMD.CONNECTED,
          protocol: 1,
          timeout: 60,
        }),
      );
    }
  }

  onOpen(handler: () => void): void {
    handler();
  }

  onClose(): void {
    // no-op for fake transport
  }

  emit(frame: unknown): void {
    this.messageHandler?.(JSON.stringify(frame));
  }
}

function createFactory(transport: FakeHasTransport): HasTransportFactory {
  return () => transport;
}

describe('HasSessionService', () => {
  let transport: FakeHasTransport;
  let service: HasSessionService;
  let files: {
    readTextFile: jest.Mock;
    writeSecretFile: jest.Mock;
    deleteFile: jest.Mock;
    sessionPath: jest.Mock;
  };

  afterEach(() => {
    service.onModuleDestroy();
  });

  beforeEach(async () => {
    transport = new FakeHasTransport();
    files = {
      readTextFile: jest.fn().mockResolvedValue(null),
      writeSecretFile: jest.fn().mockResolvedValue(undefined),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      sessionPath: jest.fn().mockReturnValue('/tmp/session.json'),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AgentWalletAuthService,
        PendingRequestsStore,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const values: Record<string, unknown> = {
                port: 7500,
                host: '127.0.0.1',
                odlNetwork: 'testnet',
                odlCustomJsonId: 'odl-testnet',
                hasWsUrl: 'wss://hive-auth.test/',
                hasAppName: 'ODL Agent',
                dataDir: '/tmp/agent-wallet-test',
                persistSession: false,
                bearerToken: 'test-bearer-token-1234567890',
              };
              return values[key];
            },
          },
        },
        {
          provide: LocalFilesService,
          useValue: files,
        },
        {
          provide: HAS_TRANSPORT_FACTORY,
          useFactory: () => createFactory(transport),
        },
        HasSessionService,
      ],
    }).compile();

    service = moduleRef.get(HasSessionService);
    await moduleRef.get(AgentWalletAuthService).onModuleInit();
  });

  it('returns login deep link immediately without waiting for approval', async () => {
    const started = await service.loginStart('alice');

    expect(started.deepLink.startsWith('has://auth_req/')).toBe(true);
    expect(started.qrAscii.length).toBeGreaterThan(0);
    expect(service.loginStatus(started.requestId).status).toBe('pending');
  });

  it('activates session after auth_ack and hides secrets in has_session', async () => {
    const started = await service.loginStart('alice');

    const deepLinkPayload = JSON.parse(
      Buffer.from(started.deepLink.replace('has://auth_req/', ''), 'base64').toString(
        'utf8',
      ),
    ) as { uuid: string; key: string };

    transport.emit({
      cmd: HAS_CMD.AUTH_ACK,
      uuid: deepLinkPayload.uuid,
      data: encryptHasPayload(
        { token: 't1', expire: Date.now() + 3_600_000 },
        deepLinkPayload.key,
      ),
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    const status = service.loginStatus(started.requestId);
    expect(status.status).toBe('active');

    const session = service.getSessionInfo();
    expect(session).toEqual({
      account: 'alice',
      expiresAt: expect.any(Number),
    });

    const serialized = JSON.stringify(session);
    expect(serialized).not.toContain('t1');
    expect(serialized).not.toContain(deepLinkPayload.key);
  });

  it('rejects broadcast without active session', async () => {
    await expect(
      service.broadcastStart({
        ops: [
          {
            type: 'custom_json',
            json: '{"events":[]}',
            required_auths: [],
            required_posting_auths: ['alice'],
            id: 'odl-testnet',
          },
        ],
        keyType: 'posting',
      }),
    ).rejects.toThrow('No active HAS session');
  });

  it('marks login rejected on auth_nack', async () => {
    const started = await service.loginStart('alice');

    const { uuid, key } = JSON.parse(
      Buffer.from(started.deepLink.replace('has://auth_req/', ''), 'base64').toString(
        'utf8',
      ),
    ) as { uuid: string; key: string };

    transport.emit({
      cmd: HAS_CMD.AUTH_NACK,
      data: CryptoJS.AES.encrypt(uuid, key).toString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(service.loginStatus(started.requestId).status).toBe('rejected');
  });
});

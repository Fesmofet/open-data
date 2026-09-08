import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { WAIVIO_ACCESS_REFRESH_SKEW_MS } from '../constants/waivio-auth';
import { LocalFilesService } from './local-files.service';
import { WaivioAuthSessionService } from './waivio-auth-session.service';
import type { WaivioAuthClientService } from './waivio-auth-client.service';

describe('WaivioAuthSessionService', () => {
  let dataDir: string;

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'persistSession') {
        return true;
      }
      if (key === 'dataDir') {
        return dataDir;
      }
      if (key === 'defaultAccount') {
        return 'alice';
      }
      return undefined;
    }),
  };

  const authClient = {
    refresh: jest.fn(),
    logout: jest.fn(),
  } as unknown as WaivioAuthClientService;

  let files: LocalFilesService;
  let service: WaivioAuthSessionService;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), 'agent-wallet-waivio-'));
    jest.clearAllMocks();
    files = new LocalFilesService(config as never);
    service = new WaivioAuthSessionService(config as never, files, authClient);
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('keeps access tokens separate per account', async () => {
    await service.establishSession({
      account: 'alice',
      provider: 'keychain',
      accessToken: 'access-alice',
      refreshToken: 'refresh-alice',
    });
    await service.establishSession({
      account: 'bob',
      provider: 'keychain',
      accessToken: 'access-bob',
      refreshToken: 'refresh-bob',
    });

    await expect(service.getAccessToken('alice')).resolves.toBe('access-alice');
    await expect(service.getAccessToken('bob')).resolves.toBe('access-bob');
  });

  it('persists refresh token but not access JWT', async () => {
    await service.establishSession({
      account: 'alice',
      provider: 'keychain',
      accessToken: 'access-alice',
      refreshToken: 'refresh-alice',
    });

    const path = files.waivioAuthSessionPath('alice');
    expect(existsSync(path)).toBe(true);
    const persisted = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
    expect(persisted.refreshToken).toBe('refresh-alice');
    expect(persisted.account).toBe('alice');
    expect(persisted.accessToken).toBeUndefined();
  });

  it('creates session file with mode 0600 on POSIX', async () => {
    if (process.platform === 'win32') {
      return;
    }
    await service.establishSession({
      account: 'alice',
      provider: 'keychain',
      accessToken: 'access-alice',
      refreshToken: 'refresh-alice',
    });
    const mode = statSync(files.waivioAuthSessionPath('alice')).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('getDefaultStatus does not fall back to first persisted account', async () => {
    await service.establishSession({
      account: 'bob',
      provider: 'keychain',
      accessToken: 'access-bob',
      refreshToken: 'refresh-bob',
    });

    expect(service.getDefaultStatus()).toEqual({ active: false });
    expect(service.getStatus('bob').active).toBe(true);
  });

  it('restores per-account session files from waivio-auth on init', async () => {
    await files.ensureWaivioAuthDir();
    await files.writeSecretFileAtomic(
      files.waivioAuthSessionPath('alice'),
      `${JSON.stringify({
        account: 'alice',
        provider: 'keychain',
        refreshToken: 'restored-refresh',
      })}\n`,
    );

    const restored = new WaivioAuthSessionService(config as never, files, authClient);
    await restored.onModuleInit();

    expect(restored.getStatus('alice')).toMatchObject({
      active: true,
      account: 'alice',
      provider: 'keychain',
    });
  });

  it('migrates legacy single-session file on init', async () => {
    writeFileSync(
      files.legacyWaivioAuthSessionPath(),
      `${JSON.stringify({
        account: 'alice',
        provider: 'keychain',
        refreshToken: 'legacy-refresh',
      })}\n`,
    );

    await service.onModuleInit();
    expect(existsSync(files.waivioAuthSessionPath('alice'))).toBe(true);
    expect(existsSync(files.legacyWaivioAuthSessionPath())).toBe(false);
    expect(service.getStatus('alice').active).toBe(true);
  });

  it('logout removes only the named account file', async () => {
    await service.establishSession({
      account: 'alice',
      provider: 'keychain',
      accessToken: 'access-alice',
      refreshToken: 'refresh-alice',
    });
    await service.establishSession({
      account: 'bob',
      provider: 'keychain',
      accessToken: 'access-bob',
      refreshToken: 'refresh-bob',
    });

    await service.logout('alice');
    expect(existsSync(files.waivioAuthSessionPath('alice'))).toBe(false);
    expect(existsSync(files.waivioAuthSessionPath('bob'))).toBe(true);
    expect(service.getStatus('bob').active).toBe(true);
  });

  it('rejects invalid account names before writing files', async () => {
    await expect(
      service.establishSession({
        account: '../../evil',
        provider: 'keychain',
        accessToken: 'access',
        refreshToken: 'refresh',
      }),
    ).rejects.toThrow(/Invalid Hive account name/);
    expect(existsSync(join(files.waivioAuthDir(), 'evil.json'))).toBe(false);
  });

  it('refreshes access token only inside skew window', async () => {
    authClient.refresh = jest.fn().mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    await service.establishSession({
      account: 'alice',
      provider: 'keychain',
      accessToken: 'old-access',
      refreshToken: 'refresh-alice',
      accessExpiresInSec: 1,
    });

    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(service.getAccessToken('alice')).resolves.toBe('new-access');
    expect(authClient.refresh).toHaveBeenCalledTimes(1);

    authClient.refresh = jest.fn();
    (service as unknown as {
      access: Map<string, { token: string; expiresAtMs: number }>;
    }).access.set('alice', {
      token: 'cached',
      expiresAtMs: Date.now() + WAIVIO_ACCESS_REFRESH_SKEW_MS + 5_000,
    });
    await expect(service.getAccessToken('alice')).resolves.toBe('cached');
    expect(authClient.refresh).not.toHaveBeenCalled();
  });
});

import { AgentWalletAuthService } from './agent-wallet-auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';

describe('BearerAuthGuard', () => {
  const auth = {
    isAuthorized: jest.fn(),
  } as unknown as AgentWalletAuthService;

  const guard = new BearerAuthGuard(auth);

  it('rejects missing bearer token', () => {
    (auth.isAuthorized as jest.Mock).mockReturnValue(false);
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as never),
    ).toThrow('Invalid or missing bearer token');
  });

  it('allows valid bearer token', () => {
    (auth.isAuthorized as jest.Mock).mockReturnValue(true);
    expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'Bearer ok' } }),
        }),
      } as never),
    ).toBe(true);
  });
});

describe('AgentWalletAuthService', () => {
  it('compares bearer tokens exactly', async () => {
    const files = {
      readTextFile: jest.fn().mockResolvedValue(null),
      writeSecretFile: jest.fn().mockResolvedValue(undefined),
      tokenPath: () => '/tmp/token',
    };

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'bearerToken') return 'secret-token-value-123456';
        return undefined;
      }),
    };

    const service = new AgentWalletAuthService(config as never, files as never);
    await service.onModuleInit();

    expect(service.isAuthorized('Bearer secret-token-value-123456')).toBe(true);
    expect(service.isAuthorized('Bearer wrong')).toBe(false);
    expect(service.isAuthorized(undefined)).toBe(false);
  });
});

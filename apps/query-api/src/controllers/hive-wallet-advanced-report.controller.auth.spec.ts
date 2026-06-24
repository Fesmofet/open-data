import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAccessGuard } from '@opden-data-layer/clients';

describe('HiveWalletAdvancedReportController auth (JwtAccessGuard)', () => {
  let guard: JwtAccessGuard;

  beforeEach(() => {
    guard = new JwtAccessGuard({
      verify: jest.fn().mockImplementation(() => {
        throw new Error('invalid');
      }),
    } as unknown as JwtService);
  });

  it('returns 401 when Authorization Bearer header is missing', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    };

    expect(() => guard.canActivate(ctx as never)).toThrow(UnauthorizedException);
  });

  it('returns 401 when Bearer token is invalid', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer bad-token' } }),
      }),
    };

    expect(() => guard.canActivate(ctx as never)).toThrow(UnauthorizedException);
  });
});
